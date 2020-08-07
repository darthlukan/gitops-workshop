# GitOps Workshop

Authors:
 - Brian Tomlinson <btomlins@redhat.com>
 - Skylar Scaling <sscaling@redhat.com>


## Description

A workshop designed to impart the core principals of GitOps and Infrastructure as Code (IaC) using
[Ansible](https://www.ansible.com/), [ArgoCD](https://argoproj.github.io/projects/argo-cd), [Tekton](https://tekton.dev/), and [OpenShift](https://www.openshift.com/).


## Prerequisites

### Tools

The following are requirements for both administrators setting up and facilitating the workshop, as well as attendees
participating in the workshop.

- [Ansible 2.8+](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#installing-ansible)
- [Git 2.26+](https://git-scm.com/downloads)


### Environment

For the best possible performance, it is recommended the workshop be conducted on a hosted (either bare-metal or via cloud provider)
Red Hat OpenShift 4.x or Kubernetes 1.16+ cluster. However, the following local solutions have been tested and verified to
work well enough for small audiences.

- [Code Ready Containers 1.13+](https://access.redhat.com/documentation/en-us/red_hat_codeready_containers/1.13/html/getting_started_guide/index)
- [Minishift 1.34+](https://www.okd.io/minishift/)


## Agenda

- Overview
- Accessing The Workshop
- What is GitOps?
- Why GitOps?
- Sample Application Walkthrough
- Sample App CI Walkthrough
- Sample App GitOps in Action
- Prepare Your Environment
- Initial Deployment
- Making Changes
- What Just Happened?
- Sample Infrastructure Demo
- Considerations for production implementations
- Further reading


### Overview

In this workshop we will cover GitOps concepts in the context of a sample application with a CI/CD pipeline. We will use
Tekton for our CI (Continuous Integration) solution and ArgoCD for CD (Continuous Delivery) solution. There are other
tools we could use for CI/CD under a GitOps model on Kubernetes/OpenShift, however Tekton was purpose-built to be a
cloud and Kubernetes native CI solution and ArgoCD provides a class 5 ("Autopilot") operator for Kubernetes. The important
parts are the functionality, level of automation, and familiarity of Kubernetes objects so as not to distract
participants from the purpose of the workshop: Understanding GitOps and its value as a methodology.

This workshop makes use of Ansible to install components and set up the workshop environment. Participants are not
required to use the provided `partcipant-*.yaml` playbooks, they are merely provided to save time. If you find that
following along is difficult or if you are pressed for time, run the associated playbook (will be noted in each relevant
section) to catch up.


### Accessing The Workshop

The workshop can be accessed directly via GitHub [here](https://github.com/darthlukan/gitops-workshop). Feel free to
fork the repo to your own GitHub account in order to follow along. To run the workshop, contact your facilitator for
cluster access or provision your own local cluster using [Code Ready Containers](https://code-ready.github.io/crc/) or [Minishift](https://www.okd.io/minishift/) and then run the
`ansible/playbook.yaml` to configure the necessary workshop components.

*Facilitator's Note*: Once you have a Kubernetes or OpenShift cluster provisioned, take note of the path to your
`kubeconfig` and execute the following:

```
$ cd ansible
$ ansible-playbook -i inventory -c local playbook.yaml -e kubeconfig=/path/to/kubeconfig
```

> The above command will install the latest releases of the `oc`, `kubectl`, and `argocd` binaries to your `$HOME/bin`,
> the ArgoCD operator at the cluster-scope, the Tekton operator at the cluster scope, provision an instance of ArgoCD,
> deploy the `workshop` project in ArgoCD and the `sample-app` and `sample-infra` components within that project.


### What is GitOps?

GitOps is a continuous delivery methodology for applying configuration based on assets stored in a git repository.
Typical implementations of GitOps include manually applying configuration assets or making use of tools which can
automatically apply those assets by responding to events.


### Why GitOps?

GitOps provides a way for Developers and Operations Engineers to declaratively describe application and infrastructure
components and their desired state, provide traceability of changes, and perform operations via pull request, among other things. 
Developers are already used to managing their application source code via `git`, as are Operations Engineers who
make use of Infrastructure as Code practices. GitOps makes use of all of that and fills the continuous delivery gap.


### Sample Application Walkthrough

Our `sample-app` for today is a simple Go program which periodically prints a greeting to `STDOUT`. It will continue to
run until stopped and can be executed via a container image defined in its `Dockerfile`. It includes a `Makefile` to
simplify building the binary and the container image.

The desired deployment target of this application is a Kubernetes/OpenShift cluster. The desired configuration for our
application is stored in `sample-app-config`. Within this directory we have defined the objects necessary for the
app to run on a cluster: a `Deployment` in `sample-app-deployment.yaml`, a `Namespace` in `sample-app-namespace.yaml`,
and a `Networkpolicy` in `sample-app-networkpolicy.yaml`. This `sample-app-config` would generally be deployed to a
separate Git repository, but for our purposes we are maintaining it in a separate directory within this repository.


### Sample Application CI Walkthrough

The `sample-app-ci` directory contains the object manifests which define the CI implementation for our sample
application. Because the CI solution uses Tekton, we already have a delcarative definition of the pipeline and its
required objects, so there's no need to separate the pipeline pre-requisite infrastructure and components from the
pipeline: they are one and the same.

In this case, we have the `sub.yaml` which defines [OpenShift Pipelines Operator](https://www.openshift.com/learn/topics/pipelines) subscription
which allows us to install the OpenShift Pipelines Operator and have it managed via the OpenShift cluster's [Operator
Lifecycle
Manager](https://docs.openshift.com/container-platform/4.5/operators/understanding_olm/olm-understanding-olm.html). We
also have a `Persistant Volume Claim` as defined in `sample-app-pvc.yaml`, a custom `Task` in
`make-sample-app-task.yaml`, the actual `Pipeline` in `pipeline.yaml`, and a `PipelineRun` in `run.yaml`. 

In Tekton, a `Pipeline` is a pipeline definition componsed of `Task` objects. `Tasks` can be executed individually via a
`TaskRun` object, but here we want to use them in a pipeline. In order to execute a `Pipeline`, Tekton provides a
`PipelineRun` object. We use this to provide values to parameters defined in the `Pipeline` and its `Tasks`.

Our `Pipeline` contains tasks for performing a `git-clone`, building the application and its container image, pushing
the image to an image registry, and committing a change to the `sample-app-config/sample-app-deployment.yaml` so that it
is updated with the image it just built.


### Sample App GitOps in Action

DEMO SAMPLE APP RECONCILIATION


### Prepare Your Environment

*IMPORTANT!* _You must first fork this repository, [https://github.com/darthlukan/gitops-workshop](https://github.com/darthlukan/gitops-workshop), to your GitHub account._

> *NOTE:* Your username MUST be entered as all lowercase characters to create a valid namespace.

```
$ cd ansible
$ ansible-playbook -i inventory participants-setup.yaml -e kubeconfig=/path/to/kubeconfig -e participant="YOUR_USERNAME"
```

> *INSTRUCTION:* Execute the playbook referenced above during the workshop in the interest of time. The steps executed by the
> playbook are described below.

Make sure you are logged into the cluster with a user that has `self-provisioner` set, then execute the following to
create your namespace and set yourself as a namespace admin:

OpenShift:

```
$ oc new-project $YOUR_USERNAME-gitops
```

For Kubernetes, you will need elevated permissions to create the namespace and then assign the `admin` cluster role.
Kubernetes:

```
$ kubectl config set-context default/$CLUSTER/$YOUR_ADMIN_USERNAME --user=$YOUR_ADMIN_USERNAME/$CLUSTER --cluster=$CLUSTER --namespace=default
$ kubectl create namespace $YOUR_USERNAME-gitops
$ kubectl create rolebinding $YOUR_USERNAME-namespace-admin --clusterrole=admin --user=$YOUR_USERNAME -n $YOUR_USERNAME-gitops
$ kubectl config set-context $YOUR_USERNAME-gitops/$CLUSTER/$YOUR_USERNAME --user=$YOUR_USERNAME/$CLUSTER --cluster=$CLUSTER --namespace=$YOUR_USERNAME-gitops
```

> *NOTE:* With `self-provisioner` permissions set in OpenShift, you do not need to create the `RoleBinding`, it is done
> for you as part of the project request.

Now we will create the directories to work from and copy over the files we'll be editing:

```
$ cd /path/to/gitops-workshop
$ cp -r sample-app-config $YOUR_USERNAME-sample-app-config
$ mkdir $YOUR_USERNAME-customresources
$ cp -r ansible/files/workshop-sample-app-ci-cr.yaml $YOUR_USERNAME-customresources
$ cp -r ansible/files/workshop-sample-app-cr.yaml $YOUR_USERNAME-customresources
```

Next we need to edit the files so that they are personalized and don't cause conflicts with any other workshop
participants:

```
$ cd $YOUR_USERNAME-sample-app-config
$ sed -i 's/sample-app/$YOUR_USERNAME-sample-app/g' sample-app-deployment.yaml sample-app-namespace.yaml sample-app-networkpolicy.yaml
$ cd ../$YOUR_USERNAME-customresources
$ sed -i 's/sample-app/$YOUR_USERNAME-sample-app/g' workshop-sample-app-ci-cr.yaml workshop-sample-app-cr.yaml
```

*NOTE:* _The following is NOT completed by the playbook referenced at the top of this section and must be executed manually._

Create a branch that is named `$YOUR_USERNAME` and push your first commit:

```
$ git checkout -b $YOUR_USERNAME
$ git add $YOUR_USERNAME-sample-app-config $YOUR_USERNAME-customresources
$ git commit -m "environment set up"
$ git push -u origin $YOUR_USERNAME
```

That's it, your environment is now prepared for the rest of the workshop content. To recap, we've forked the workshop
content to our own GitHub accounts, copied and personalized the files with which we'll be working, and established our
"feature" branch.


### Initial Deployment

In this section we will tell ArgoCD to deploy our application and pipeline. We will be using `CustomResources`, which
are instances of a `CustomResourceDefinition`, to represent our deployments. In this case we will be using the
`Application` "type" object to tell ArgoCD about our `sample-app` and `sample-app-ci` pipeline.

> *NOTE:* Execute the following playbook if you have difficulty following along or just wish to save time:

```
$ cd /path/to/gitops-workshop/ansible
$ ansible-playbook -i inventory participants-deploy.yaml -e kubeconfig=/path/to/kubeconfig -e participant=$YOUR_USERNAME
```

First, let's deploy the application and ci pipeline. You will need to change to the `$YOUR_USERNAME-customresources` directory and use
either `oc` or `kubectl` to apply the `CustomResources` depending on the cluster type you're using ("Vanilla" Kubernetes
or OpenShift):

```
$ cd $YOUR_USERNAME-customresources
$ oc apply -f workshop-sample-app-cr.yaml
$ oc apply -f workshop-sample-app-ci-cr.yaml
```

Inside your cluster console, from the navigation pane you can select Networking -> Routes to view the available URLs for connection to your deployed ArgoCD instance.

> *NOTE:* You will need to have the `argocd` project selected to view the relevant routes.

![ArgoCD Routes](/docs/images/01&#32;-&#32;ArgoCD&#32;Route.png "ArgoCD Routes")

Click on the URL in the Location column for the route named `workshop-argocd-server`. This will open the ArgoCD login page: 

![ArgoCD Login Page](/docs/images/02&#32;-&#32;ArgoCD&#32;Login.png "ArgoCD Login Page")

In order to login to the ArgoCD server, you will need to retrieve the admin password from the Argo CD deployed secret. Execute the following commands to retrieve the password:

```
$ oc project argocd
$ export ARGOCD_CLUSTER_NAME=workshop
$ oc get secret $ARGOCD_CLUSTER_NAME-argocd-cluster -o jsonpath='{.data.admin\.password}' | base64 -d
```

The returned string will be the password for the admin user login to Argo CD.

You will see the Argo CD Applications dashboard, and you should see the pipelines we created for our `workshop` project:

![ArgoCD Console](/docs/images/03&#32;-&#32;ArgoCD&#32;Console.png "ArgoCD Console")

### Making Changes

Now comes the fun part. We are going to make some changes to our files in git, commit and push them, and watch how ArgoCD
automatically syncs those changes so that we don't have to manually log into the cluster and perform the deployment
operation ourselves.

> *NOTE:* Execute the following playbook to save time or if you encounter an error attempting to follow the steps in
> this section:

```
$ cd /path/to/gitops-workshop/ansible
$ ansible-playbook -i inventory participants-make-changes.yaml -e kubeconfig=/path/to/kubeconfig -e participant=$YOUR_USERNAME
```

First let's make a small change, adding a more personalized greeting to the `sample-app-deployment.yaml` manifest. The
provided `sample-app-deployment.yaml` defaults to a very generic greeting, `'Hello participant\!'` as described by the
file content below:

```
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: sample-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
        - name: sample-app
          image: "quay.io/sscaling/gitops-workshop:v0.0.1"
          command:
            - '/usr/bin/greet'
          args:
            - 'Hello participant\!'
...
```

To change this, you can use your text editor or execute the following commands:

```
$ cd /path/to/gitops-workshop/$YOUR_USERNAME-sample-app-config
$ sed -i 's/participant/$YOUR_USERNAME/g' sample-app-deployment.yaml
```

The result is that the arg on line `25` no longer says `'Hello participant\!'`, but instead reflects whatever
`$YOUR_USERNAME` is. For example: `'Hello btomlins\!'`. If `$YOUR_USERNAME` is `btomlins`, then you should see the
following completed file:

```
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: sample-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
        - name: sample-app
          image: "quay.io/sscaling/gitops-workshop:v0.0.1"
          command:
            - '/usr/bin/greet'
          args:
            - 'Hello btomlins\!'
...
```

In order for ArgoCD to act upon this change, we will need to commit our changes and push them to our remote repo. You
can do so using the following commands:

```
$ git add sample-app-deployment.yaml
$ git commit -m "Add $YOUR_USERNAME to deployment"
$ git push -u origin $YOUR_USERNAME
```

TODO: Screenshots of the result

### Further Reading

For those that wish to learn more about GitOps, and the tools that are currently available to implement GitOps workflows quickly and efficiently, check out the following resources:

- [ArgoCD - GitOps continuous delivery tool for Kubernetes](https://argoproj.github.io/argo-cd/ "ArgoCD Overview")

- [Tekton - Continuous integration and delivery solution for Kubernetes](https://tekton.dev/docs/ "Tekton Docs")

- [OpenShift Pipelines - OCP specific Tekton integration](https://www.openshift.com/learn/topics/pipelines "OpenShift Pipelines Overview")

- [Introduction to GitOps with OpenShift](https://www.openshift.com/blog/introduction-to-gitops-with-openshift "GitOps with OpenShift")

- [GitOps Overview - High level explanation of GitOps Philosophy](https://www.gitops.tech/ "GitOps")
