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


## Facilitator Usage

Facilitators of this workshop can automatically provision the requisite components using the supplied playbooks. You
must have `cluster-admin` or an administrative role that allows creation and modification of `CustomResourceDefinitions`
and `InstallPlans` at the cluster scope in order to install the operator components used herein.


### Using the Dockerfile

This workshop comes with a `Dockerfile` defining an environment from which facilitators and participants may execute the
Ansible playbooks from this repository. The resulting image of the `Dockerfile` is available at
[https://quay.io/btomlins/gitops-workshop](https://quay.io/btomlins/gitops-workshop). The simplest way to use the image
is:

```
$ podman pull quay.io/btomlins/gitops-workshop:latest
$ podman run -v /path/to/gitops-workshop:/projects/gitops-workshop:z -it quay.io/btomlins/gitops-workshop:latest /bin/sh
>> sh-4.4#
sh-4.4# cd /projects/gitops-workshop
sh-4.4# ls -allh
```
From there, you may execute `ansible-playbook`, `git`, and `oc` commands described in this workshop.


### Building the image from the Dockerfile

Your local machine or cluster may not be able to pull the pre-built image due to policy restrictions. In that case, you
may execte the following to build the image via the `Dockerfile`:

```
$ podman build -f Dockerfile -t $REGISTRY/gitops-workshop:$TAG
```

From there, execute the steps defined in the previous section in order to use the image.


### Setup the facilitator's local host

The following commands will:
- Install the requirements for the facilitator's `playbook.yaml`
- Install CLI pre-requisite tools (`oc`, `kubectl`, `argocd`)
- Install the ArgoCD Operator
- Instantiate/Deploy the `sample-app`, `sample-app-ci`, and `sample-infra` operands

> *NOTE:* If you do not have a kubeconfig file in your workspace, be sure to perform an oc login to your destination cluster from your workspace.

```
$ cd /path/to/gitops-workshop/ansible
$ ansible-galaxy collection install -r requirements.yaml
$ ansible-playbook -i inventory playbook.yaml \
  -e kubeconfig=/path/to/kubeconfig \
  -e scope=cluster \ # Alternatively, you can use 'namespace' 
  -e internal_registry=$REGISTRY_NAME \ # Omit this unless using a registry such as Artifactory or Nexus to limit image access
  -e state=present \ # Use 'absent' to undeploy
  -e argo_release_tag=v1.7.1 \
  -e operator_release_tag=v0.0.12
```

Now we have to update the Tekton pipeline to have the proper GitHub and registry-pull Secrets:

> *NOTE:* If facilitating this workshop yourself, you will need to create your own secrets in the `secrets.yaml` playbook.

```
$ ansible-playbook -i inventory secrets.yaml \
  -e kubeconfig=/path/to/kubeconfig \
  --ask-vault-pass
```

Enter your ansible-vault password when prompted, and the pipeline service account will be patched with the required Secrets.

### Setup Code Ready Workspace

The workshop image specified in the `Dockerfile` is consumable within Code Ready Workspaces, a `devfile` called
`code-ready-workspace.yaml` is provided at the root of this repository. To use it, simply execute the steps described
[here](https://access.redhat.com/documentation/en-us/red_hat_codeready_workspaces/2.2/html/end-user_guide/workspaces-overview_crw#creating-a-workspace-from-custom-workspace-view-of-user-dashboard_creating-a-workspace-from-code-sample) and provide the Devfile URL in the appropriate field rather than from the drop-down list as described in the doc.
The Devfile URL for the primary copy of the `code-ready-workspace.yaml` Devfile is [https://raw.githubusercontent.com/darthlukan/gitops-workshop/master/code-ready-workspace.yaml](https://raw.githubusercontent.com/darthlukan/gitops-workshop/master/code-ready-workspace.yaml).

Alternatively, you may simply copy and paste the contents of `code-ready-workspace.yaml` into the `Devfile` editor box
in the Custom Workspace creation page.


## License

Apache-2.0. See LICENSE file.
