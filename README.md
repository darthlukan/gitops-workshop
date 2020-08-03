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
- Prepare your environment
- Making changes
- What just happened?
- Sample Infrastructure Demo
- Considerations for production implementations
- Further reading


### Overview

In this workshop we will cover GitOps concepts in the context of a sample application with a CI/CD pipeline. We will use
Tekton for our CI (Continuous Integration) solution and ArgoCD for CD (Continuous Delivery) solution. There are other
tools we could use for CI/CD under a GitOps model on Kubernetes/OpenShift, however Tekton was purpose-built to be a
cloud and Kubernetes native CI solution and ArgoCD provides a class 5 ("Autopilot") operator for Kuberenetes. The important
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


### Prepare your environment

> If you have trouble following along in this section execute the `ansible/participant-setup.yaml` playbook like so:

```
$ cd ansible
$ ansible-playbook -i inventory participant-setup.yaml -e kubeconfig=/path/to/kubeconfig -e participant="YOUR_USERNAME"
```









