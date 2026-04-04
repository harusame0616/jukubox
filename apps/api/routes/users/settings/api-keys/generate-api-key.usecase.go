package apikeys

type GenerateApiKey struct {
}

type GenerateApiKeyRepository interface {
	save(ApiKey)
}

type GenerateApiKeyUsecase struct {
	repository GenerateApiKeyRepository
}

func (GenerateApiKeyUsecase) GenerateGenerateApiKeyUsecase(repository GenerateApiKeyRepository) GenerateApiKeyUsecase {
	return GenerateApiKeyUsecase{repository: repository}

}
