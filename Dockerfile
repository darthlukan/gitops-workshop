FROM registry.access.redhat.com/ubi8:latest

# Install dependencies
RUN yum install -y python3-pip git && \
    /usr/bin/pip3 install ansible github3.py openshift && \
    curl -o /tmp/openshift-client-linux.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/openshift-client-linux.tar.gz && \
    tar -xzvf /tmp/openshift-client-linux.tar.gz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/oc && \
    rm /usr/local/bin/README.md && \
    rm /usr/local/bin/kubectl && \
    rm /tmp/openshift-client-linux.tar.gz && \
    yum clean all -y
