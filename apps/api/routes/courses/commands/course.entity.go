package commands

import (
	"errors"
	"time"
)

type Topic struct {
	topicId            string
	title              string
	description        string
	prerequisites      string
	knowledge          string
	flow               string
	quiz               string
	completionCriteria string
	number             int
}

type Section struct {
	sectionId   string
	title       string
	description string
	number int
	topics      []Topic
}

type Author struct {
	authorId string
	name     string
}

type Category struct {
	categoryId string
	name       string
}

type Course struct {
	courseId      string
	title         string
	description   string
	slug          string
	tags          []string
	publishStatus string
	category      Category
	publishedAt   *string
	author        Author
	visibility    string
	sections      []Section
}

type EnrollNumber struct {
	SectionNumber *int
	TopicNumber *int
}

type ProgressRecord struct {
	courseSectionId string
	courseSectionTopicId string
	sectionNumber int
	topicNumber int
	status string
	startedAt string
	completedAt *string
}

type Progress struct {
	courseId string
	records []ProgressRecord
}



func (p *Progress) lastTopic() (status string, sectionNumber int, topicNumber int) {
	var maxRecord ProgressRecord = ProgressRecord{ "", "", 0, 0, "not started", "", nil };

	for _, record := range p.records {
		if record.sectionNumber > maxRecord.sectionNumber || (record.sectionNumber == maxRecord.sectionNumber && record.topicNumber > maxRecord.topicNumber) {
			maxRecord = record
		}
	}

	return maxRecord.status, maxRecord.sectionNumber, maxRecord.topicNumber
}

func (p *Progress) start(section Section, topic Topic) {
	for _, record := range p.records {
		// 開始済み、完了済みの場合は何もしない
		if record.courseSectionTopicId == topic.topicId && record.courseSectionId == section.sectionId {
			return;
		}
	}


	p.records = append(p.records, ProgressRecord{
		courseSectionId: section.sectionId,
		courseSectionTopicId: topic.topicId,
		sectionNumber: section.number,
		topicNumber: topic.number,
		status: "started",
		startedAt: time.Now().Format(time.RFC3339),
		completedAt: nil,
	})
}



var ErrEnrollmentNumberIsNotFound = errors.New("enrollment number is not found");

func (course *Course)enroll(enrollNumber EnrollNumber, progress *Progress) (error){
	sectionNumber := 0
	topicNumber := 0

	if enrollNumber.SectionNumber != nil {
		sectionNumber = *enrollNumber.SectionNumber;

		if enrollNumber.TopicNumber == nil {
			topicNumber = 0;
		} else {
			topicNumber = *enrollNumber.TopicNumber;
		}

	} else if enrollNumber.SectionNumber == nil && enrollNumber.TopicNumber == nil {
		status, lastSectionNumber, lastTopicNumber := progress.lastTopic();
		if status== "completed" {
			nextPosition, err := course.nextTopic(TopicPosition{sectionNumber: lastSectionNumber, topicNumber: lastTopicNumber})

			if err != nil {
				return  ErrEnrollmentNumberIsNotFound
			}
			sectionNumber, topicNumber = nextPosition.sectionNumber, nextPosition.topicNumber
		} else if status == "started" {
			sectionNumber = lastSectionNumber
			topicNumber =  lastTopicNumber
		} else {
			sectionNumber = 1
			topicNumber = 1
		}
	}

	section, topic, err := course.getTopic(sectionNumber, topicNumber)
	if err != nil {
		return  ErrEnrollmentNumberIsNotFound;
	}

	progress.start(section, topic)

	return nil;
}

type TopicPosition struct {
	sectionNumber int
	topicNumber int
}

var ErrTopicPositionOutOfRange = errors.New("topic position is out of range")

func (course *Course) getTopic(sectionNumber int, topicNumber int) (Section, Topic, error) {
	if sectionNumber < 1 || sectionNumber > len(course.sections) {
		return Section{}, Topic{}, ErrTopicPositionOutOfRange
	}
	section := course.sections[sectionNumber-1]
	if topicNumber < 1 || topicNumber > len(section.topics) {
		return Section{}, Topic{}, ErrTopicPositionOutOfRange
	}
	return section, section.topics[topicNumber-1], nil
}

func (course *Course) nextTopic(currentTopicPosition TopicPosition) (topicPosition TopicPosition, err error) {
	if currentTopicPosition.sectionNumber >= len(course.sections) || currentTopicPosition.sectionNumber < 0 {
		return TopicPosition{}, ErrTopicPositionOutOfRange
	}

	if currentTopicPosition.topicNumber >= len(course.sections[currentTopicPosition.sectionNumber].topics) || currentTopicPosition.topicNumber < 0 {
		return TopicPosition{}, ErrTopicPositionOutOfRange
	}

	if currentTopicPosition.topicNumber == len(course.sections[currentTopicPosition.sectionNumber].topics) {
		if currentTopicPosition.sectionNumber == len(course.sections) {
			return TopicPosition{sectionNumber: 1, topicNumber: 1}, nil
		}

		return TopicPosition{sectionNumber: currentTopicPosition.sectionNumber + 1, topicNumber: 1}, nil
	}

	return TopicPosition{sectionNumber: currentTopicPosition.sectionNumber, topicNumber: currentTopicPosition.topicNumber + 1}, nil

}
