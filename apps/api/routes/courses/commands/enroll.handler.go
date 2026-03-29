package commands

import (
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/harusame0616/ijuku/apps/api/lib/validation"
)

type handler struct {
	usecase EnrollCourseUsecase
}

func (h *handler)PostEnrollmentHandler(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Content-Type", "application/json")
	courseId := r.PathValue("courseId")

	if courseId == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"code": validation.InputValidationError, "message": "courseId must be required"})
		return
	}

	var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	if !uuidRegex.MatchString(courseId) {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"code": validation.InputValidationError, "message": "courseId must be UUID format"})
		return
	}


	var enrollmentBodyParams struct {
		SectionNumber *int `json:"sectionNumber"`
		TopicNumber *int `json:"topicNumber"`
	}

	defer r.Body.Close()
	if  err:=json.NewDecoder(r.Body).Decode(&enrollmentBodyParams); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"code": validation.InputValidationError, "message": "body parameter is invalid json format"})
		return
	}


	err := h.usecase.execute(EnrollCourseUsecaseParams{
		courseId: courseId,
		sectionNumber: enrollmentBodyParams.SectionNumber,
		topicNumber: enrollmentBodyParams.TopicNumber,
	})


	if err == ErrTopicNumberRequireSectionNumber {
		w.WriteHeader(http.StatusBadRequest);
		json.NewEncoder(w).Encode(map[string]string{"code": validation.InputValidationError, "message": "topic number require section number"})
		return;
	}


}
