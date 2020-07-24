BINARY := greet
VERSION := v0.0.1

setup:
	go mod init gitops-workshop/sample-app/greet

build:
	mkdir -p build
	GOOS=linux GOARCH=amd64 go build -o build/$(BINARY)

container: build
	buildah bud -f Dockerfile -t quay.io/btomlins/greet:$(VERSION)

clean:
	rm -rf ./build
