

### Run production mode in a Docker
Navigate to a directory where p2rank-web should be and clone the repository 
using following command.
```
git clone https://github.com/siret/p2rank-web.git .
```
If you use other branch then master now is time to swith the brach, for
example you can switch to develop branch like this:
```
git checkout develop
```
In order to utilize conservation you need to have local copy of 
HSSP and Blast files. Following steps assumes you have all files ready in
```/data/conservation/blast-database``` (
[swissprot](http://skoda.projekty.ms.mff.cuni.cz/www/conservation/2019-09-18-swissprot.tar.gz), 
[trembl](http://skoda.projekty.ms.mff.cuni.cz/www/conservation/trembl), 
[uniref90](http://skoda.projekty.ms.mff.cuni.cz/www/conservation/2019-09-18-uniref90.tar.gz) ) and 
```/data/conservation/hssp``` (preprocessed [hssp](http://skoda.projekty.ms.mff.cuni.cz/www/conservation/2020-07-17-hssp-output.tar.gz)) 
respectively.

Now with the repository and data ready we can setup the Docker.
First we create a network that is going to be shared by our Docker containers.
```
docker network create --driver bridge p2rank-network
```
Next we need to build two Docker images. The first image is for API gateway 
and also host web-based frontend. The second image is p2rank runtime with
[task-runner](https://github.com/skodapetr/task-runner). As the second image
is going to generate files we also pass ```USER``` argument, to specify
*UID* that should be used for the user. This allows us to easily share
files between host and the Docker image. 
```
docker build -t p2rank-web-api-gateway -f ./api-gateway/Dockerfile .
docker build -t p2rank-web-runtime -f ./p2rank-runtime/Dockerfile --build-arg USER=$(id -u ${USER}) .
```
As we are going to redirect request from ```p2rank-web-api-gateway``` to
```p2rank-web-runtime``` we need to start the ```p2rank-web-runtime``` first.
We also need to map map files from Docker to the host machine - namely the 
conservation files, and the database of computed predictions. 
Same as with build we also specify the user.
```
docker run --name p2rank-web-runtime --network p2rank-network -v /data/conservation:/data/conservation -v /data/p2rank/database:/data/p2rank/task -u $(id -u ${USER}):$(id -g ${USER}) --rm p2rank-web-runtime
```
In the next step we start the API gateway image. We specify the network that
the container should use. We also map the Docker port 8020 to 8070 on host 
machine. This allows us to access the API gateway component. 
```
docker run --name p2rank-web-api-gateway --network p2rank-network -p 8020:80 --rm p2rank-web-api-gateway
```
You should not be able to access the p2rank web-client on port *8020* and 
run prediction.

### Run in develop mode on local machine
For the local run we utilize *frontend* as API gateway for our application.
```
cd frontend
npm install
npm run dev
```

