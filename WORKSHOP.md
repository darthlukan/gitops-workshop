# Agenda

- Overview
- What is GitOps?
- Why GitOps?
- Sample Application Walkthrough
- Sample App CI Walkthrough
- Sample App GitOps in Action
- Prepare Your Environment
- Initial Deployment
- Making Changes
- What Just Happened?
- Running the Tekton Pipeline
- Sample Infrastructure Demo
- Considerations for production implementations
- Further reading


## Overview

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


## What is GitOps?

GitOps is a continuous delivery methodology for applying configuration based on assets stored in a git repository.
Typical implementations of GitOps include manually applying configuration assets or making use of tools which can
automatically apply those assets by responding to events.


## Why GitOps?

GitOps provides a way for Developers and Operations Engineers to declaratively describe application and infrastructure
components and their desired state, provide traceability of changes, and perform operations via pull request, among other things. 
Developers are already used to managing their application source code via `git`, as are Operations Engineers who
make use of Infrastructure as Code practices. GitOps makes use of all of that and fills the continuous delivery gap.


## Sample Application Walkthrough

Our `sample-app` for today is a simple Go program which periodically prints a greeting to `STDOUT`. It will continue to
run until stopped and can be executed via a container image defined in its `Dockerfile`. It includes a `Makefile` to
simplify building the binary and the container image.

The desired deployment target of this application is a Kubernetes/OpenShift cluster. The desired configuration for our
application is stored in `sample-app-config`. Within this directory we have defined the objects necessary for the
app to run on a cluster: a `Deployment` in `sample-app-deployment.yaml`, a `Namespace` in `sample-app-namespace.yaml`,
and a `Networkpolicy` in `sample-app-networkpolicy.yaml`. This `sample-app-config` would generally be deployed to a
separate Git repository, but for our purposes we are maintaining it in a separate directory within this repository.


## Sample Application CI Walkthrough

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


## Sample App GitOps in Action

DEMO SAMPLE APP RECONCILIATION


## Prepare Your Environment

*IMPORTANT!* _You must first branch from this repository, [https://github.com/darthlukan/gitops-workshop](https://github.com/darthlukan/gitops-workshop), with your GitHub account._

> *NOTE:* Your username MUST be entered as all lowercase characters to create a valid namespace.

```
$ cd ansible
$ ansible-playbook -i inventory participants-setup.yaml -e kubeconfig=/path/to/kubeconfig -e participant="YOUR_USERNAME"
```

> *INSTRUCTION:* Execute the playbook referenced above during the workshop in the interest of time. The steps executed by the
> playbook are described below.

Make sure you are logged into the cluster with a user that has `self-provisioner` set, then execute the following to
create your namespace and set yourself as a namespace admin:

```
$ oc new-project $YOUR_USERNAME-gitops
```

Now we will create the directories to work from and copy over the files we'll be editing:

```
$ cd /path/to/gitops-workshop
$ cp -r sample-app-config $YOUR_USERNAME-sample-app-config
$ mkdir $YOUR_USERNAME-customresources
$ cp -r ansible/files/workshop-sample-app-cr.yaml $YOUR_USERNAME-customresources
```

Next we need to edit the files so that they are personalized and don't cause conflicts with any other workshop
participants:

```
$ cd $YOUR_USERNAME-sample-app-config
$ sed -i 's/sample-app/$YOUR_USERNAME-sample-app/g' sample-app-deployment.yaml sample-app-namespace.yaml sample-app-networkpolicy.yaml
$ cd ../$YOUR_USERNAME-customresources
$ sed -i 's/sample-app/$YOUR_USERNAME-sample-app/g' workshop-sample-app-cr.yaml
$ cd ../$YOUR_USERNAME-sample-app-ci
$ sed -i 's/sample-app-ci/$YOUR_USERNAME-sample-app-ci/g' 01-sample-app-ci-namespace.yaml
$ sed -i 's/master/$YOUR_USERNAME/g' 30-pipeline-run.yaml
$ sed -i 's/sample-app-config/$YOUR_USERNAME-sample-app-config/g' 30-pipeline-run.yaml
```

Finally, we need to copy and modify the file that will allow us to set up our github and pull secrets:

```
$ cd /path/to/gitops-workshop/ansible
$ cp secrets.yaml $YOUR_USERNAME-secrets.yaml
$ sed -i 's/sample-app-ci/$YOUR_USERNAME-sample-app-ci/g' $YOUR_USERNAME-secrets.yaml
```

*NOTE:* _The following is NOT completed by the playbook referenced at the top of this section and must be executed manually._

Create a branch that is named `$YOUR_USERNAME` and push your first commit:

```
$ cd /path/to/gitops-workshop
$ git checkout -b $YOUR_USERNAME
$ git add .
$ git commit -m "environment set up"
$ git push -u origin $YOUR_USERNAME
```

That's it, your environment is now prepared for the rest of the workshop content. To recap, we've branched the workshop
content, copied and personalized the files with which we'll be working, and established this as our
"feature" branch.


## Initial Deployment

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

## Making Changes

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
$ cd /path/to/gitops-workshop/$YOUR_USERNAME-sample-app-config
$ git add sample-app-deployment.yaml
$ git commit -m "Add $YOUR_USERNAME to deployment"
$ git push -u origin $YOUR_USERNAME
```

If you observe the ArgoCD Dashboard, you will see the $YOUR_USERNAME-sample-app Application recognize the change to the repository, sync the updated file, and apply the change to the deployment:

![ArgoCD Sample App Update](/docs/images/05&#32;-&#32;Sample&#32;App&#32;Update.png "ArgoCD Sample App Update")

## What Just Happened?

Several things just happened "auto-magically" based on our ArgoCD configuration.

1) ArgoCD detected a new commit to your git repository
    - `git fetch`
2) ArgoCD pulled the change into our configured Application from the latest revision
    - `git merge`
3) ArgoCD pushed the updated file to our OCP deployment
    - `oc apply -f sample-app-deployment.yaml`
4) OCP spun up a new pod containing the updated Application file, and spun down the outdated deployed pod

You can see the updated deployment in your OCP console by navigating to Workloads -> Deployments for your $YOUR_USERNAME-sample-app project:

![Updated Deployment](/docs/images/06&#32;-&#32;Updated&#32;Deployment.png "Updated Deployment") 

![Updated Pod](/docs/images/07&#32;-&#32;Updated&#32;Pod.png "Updated Pod")

## Running the Tekton Pipeline

Now we will demonstrate how the Tekton pipeline can be incorporated in the GitOps process to automate the creation of a new image version in our desired image repository.

First, we need to patch our GitHub token and image pull secrets into the Tekton pipeline Service Account:

```
$ cd /path/to/gitops-workshop/ansible
$ ansible-playbook -i inventory $YOUR_USERNAME-secrets.yaml --ask-vault-pass
```

Your workshop facilitator will provide you with the Ansible vault password you need to enter.

Now we can make a change to our pipeline run CRD, which will trigger ArgoCD to create a new PipelineRun on our OCP cluster. 
For this change, we will update the version number for our image (`image-version` in `$YOUR_USERNAME-sample-app-ci/30-pipeline-run.yaml`):

```
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  generateName: gitops-workshop-pipeline-run-
  annotations:
    argocd.argoproj.io/hook: Sync
spec:
  pipelineRef:
    name: build-increment-commit
  workspaces:
    - name: gitops-workshop-repo-source
      persistentVolumeClaim:
        claimName: git-clone-output
  params:
    - name: repo-url
      value: https://github.com/darthlukan/gitops-workshop
    - name: git-branch
      value: master
    - name: image-name
      value: quay.io/sscaling/gitops-workshop
    - name: image-version
      value: v0.0.2
    - name: app-path
      value: sample-app
    - name: app-config-path
      value: sample-app-config
    - name: app-config-filename
      value: sample-app-deployment.yaml
```

Now we will commit this change to our git repo:

```
$ cd /path/to/gitops-workshop
$ git add .
$ git commit -m "changed image version"
$ git push
```

Since our PipelineRun uses a generated name, we will need to go into the ArgoCD dashboard and click `SYNC` on our `$YOUR_USERNAME-sample-app-ci` App. 

![SYNC](/docs/images/08&#32;-&#32;SYNC.png "SYNC")

The following actions will then be triggered automatically:

- ArgoCD creates a new PipelineRun in OCP with a generated name following the pattern: `gitops-workshop-pipeline-run-<random-string>`

![New PipelineRun](/docs/images/09&#32;-&#32;New&#32PipelineRun.png "New PipelineRun")

- The Tekton pipeline checks out our feature branch, builds a new image, and pushes it to our image repository

![PipelineRun Complete](/docs/images/10&#32;-&#32;PipelineRun&#32;Complete.png "PipelineRun Complete")

- Tekton commits a NEW change to our repository indicating the updated image has been created (updates image name in `sample-app-deployment.yaml`)
- ArgoCD detects the NEW change to the repository and redeploys the application from the new image

## Considerations for production implementations

This section includes some best practices to note when considering the use of GitOps and/or related tools through production. As
the focus of the workshop is on concepts and techniques, any mention of specific tools is meant to be illustrative and
not prescriptive.

### Security

- Follow the ["Principle of Least Privilege"](https://en.wikipedia.org/wiki/Principle_of_least_privilege). Do not grant
  broad access unless broad access is actually warranted. A best practice is to have engineers document the roles and
  permissions required for their workloads based on the functionality those roles and permissions provide.
- Operations should be audited. GitOps by nature provides traceability (who did what and when) but someone or some thing
  should periodically review traced actions to ensure correctness.
- All tools should be vetted by your security team(s) and tools prior to being used in production.
- Use SSO to set up users and roles, and then remove the `admin` account. ArgoCD and other GitOps tools have [SSO functionality](https://argoproj.github.io/argo-cd/operator-manual/user-management/#sso)
  that should be used instead of "local users".
- Plan for and make use of Secrets Management before implementing GitOps or choosing your tools. Examples of tools known
  to work well in a GitOps setting are [HashiCorp Vault](https://www.vaultproject.io/), [Helm Secrets](https://github.com/zendesk/helm-secrets), and
  [Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html).

### Configuration

- Separate application configuration from application source code. Practically, this means your application manifests
  "live" in their own repository (e.g. `sample-app-config`) and your application sources (e.g. `sample-app`) are also
  stored in their own repository.
- The application configuration repo(s) should be owned by the same team writing the application, not an external team
  who can be a bottleneck to deployment.
- Test your configuration changes before committing them.
- Configuration should not change due to external changes. For example, pin your modules to versions so that you don't
  introduce drift. This also makes it easier to control version changes with Continuous Integration tools.

### Execution

- Document the steps necessary to deploy manually. With GitOps, these are primarily `git` tasks along with corresponding
  automation tools such as `ansible`, `oc`, and `kubectl`. Ensure the team understands these steps before
  introducing further automation via tools such as [ArgoCD](https://argoproj.github.io/) or [FluxCD](https://toolkit.fluxcd.io/).
- Once the manual steps are well understood, documented, and automation tools implemented, automate as much as possible. This limits
  errors caused by typos or distractions common during manual execution of tasks.


## Further Reading

For those that wish to learn more about GitOps, and the tools that are currently available to implement GitOps workflows 
quickly and efficiently, check out the following resources:

- [ArgoCD - GitOps continuous delivery tool for Kubernetes](https://argoproj.github.io/argo-cd/ "ArgoCD Overview")

- [Tekton - Continuous integration and delivery solution for Kubernetes](https://tekton.dev/docs/ "Tekton Docs")

- [OpenShift Pipelines - OCP specific Tekton integration](https://www.openshift.com/learn/topics/pipelines "OpenShift Pipelines Overview")

- [Introduction to GitOps with OpenShift](https://www.openshift.com/blog/introduction-to-gitops-with-openshift "GitOps with OpenShift")

- [GitOps Overview - High level explanation of GitOps Philosophy](https://www.gitops.tech/ "GitOps")

- [5 GitOps Best Practices](https://blog.argoproj.io/5-gitops-best-practices-d95cb0cbe9ff)

- [Understanding GitOps with Advanced Cluster Management](https://www.openshift.com/blog/understanding-gitops-with-red-hat-advanced-cluster-management)
