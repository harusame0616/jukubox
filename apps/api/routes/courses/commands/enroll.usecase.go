package commands

import "errors"

type EnrollCourseUsecaseParams struct {
	userId string
	courseId string
	sectionNumber *int
	topicNumber *int
}


type EnrollCourseUsecase struct {
	courseRepository CourseRepository
	progressRepository ProgressRepository
}


type CourseRepository interface {
	getCourseByCourseId(courseId string) Course
}

type ProgressRepository interface {
	getProgress(userId string, courseId string) Progress
	save(progress *Progress) error
}



var ErrTopicNumberRequireSectionNumber = errors.New("topic number require section number")

type EnrollCourseUsecaseResult struct {
	courseId string
	sectionNumber int
}

func (usecase EnrollCourseUsecase) execute(params EnrollCourseUsecaseParams) error{
	course := usecase.courseRepository.getCourseByCourseId(params.courseId)
	progress := usecase.progressRepository.getProgress(params.userId, params.courseId)

	course.enroll(EnrollNumber{
		SectionNumber: params.sectionNumber,
		TopicNumber: params.topicNumber,
	}, &progress)

	usecase.progressRepository.save(&progress)

	return nil
}
