FROM registry.redhat.io/rhel8/go-toolset

USER nobody

RUN pwd

RUN ls -la

RUN echo $(workspaces.source.path)

RUN echo $(params.app-path)

RUN make build

ADD build/greet /usr/bin/greet
