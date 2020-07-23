FROM image-registry.openshift-image-registry.svc:5000/gitops-workshop/nodejs-rest-http:latest

WORKDIR sample-app

COPY package*.json ./

RUN npm install openshift
COPY path/to/bin /usr/bin/bin
RUN rm -rf /path/to/source
ENTRYPOINT ["/usr/bin/bin/", "--args"]