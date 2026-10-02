package crypto

func must[T any](a T, err error) T {
	if err != nil {
		panic(err)
	}

	return a
}
