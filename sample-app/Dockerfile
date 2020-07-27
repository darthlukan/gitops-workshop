FROM registry.redhat.io/rhel8/go-toolset

USER nobody

RUN make build

ADD build/greet /usr/bin/greet
