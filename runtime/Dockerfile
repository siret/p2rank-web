#
# Build protein-utils.
#

FROM debian:buster-20200607 as protein-utils-build

RUN apt-get update \
 && apt-get -y --no-install-recommends install openjdk-11-jdk

WORKDIR /opt/protein-utils
COPY ./protein-utils ./

RUN chmod +x ./gradlew && ./gradlew installDist \
  && chmod a+x ./dist/bin/protein-utils

#
# Build rask-runner.
#

FROM debian:buster-20200607 as task-runner-build

RUN apt-get update \
 && apt-get -y --no-install-recommends install openjdk-11-jdk git vim

WORKDIR /opt/task-runner

RUN git clone https://github.com/skodapetr/task-runner.git .
RUN chmod +x ./gradlew && ./gradlew installDist \
    && chmod a+x ./dist/bin/task-runner-cli

#
# Prepare conservation.
#

FROM debian:buster-20200607 as conservation-build

RUN apt-get update \
 && apt-get -y --no-install-recommends install \
 wget curl ca-certificates \
 make g++ zlib1g-dev 

WORKDIR /opt/conservation-software

RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.9.0/ncbi-blast-2.9.0+-x64-linux.tar.gz \
 && wget https://github.com/weizhongli/cdhit/releases/download/V4.8.1/cd-hit-v4.8.1-2019-0228.tar.gz \
 && wget http://www.drive5.com/muscle/downloads3.8.31/muscle3.8.31_i86linux64.tar.gz \
 && wget http://compbio.cs.princeton.edu/conservation/conservation_code.tar.gz \
 && tar -xzf ncbi-blast-2.9.0+-x64-linux.tar.gz \
 && tar -xzf cd-hit-v4.8.1-2019-0228.tar.gz \
 && cd cd-hit-v4.8.1-2019-0228 \
 && make \
 && cd .. \
 && tar -xzf muscle3.8.31_i86linux64.tar.gz \
 && tar -xzf conservation_code.tar.gz \
 && mv conservation_code jense_shannon_divergence \
 && rm ./*.gz

RUN chmod -R a+r ./jense_shannon_divergence/matrix

WORKDIR /opt/conservation

COPY ./conservation ./

RUN chmod a+x conservation.py

#
# Main image.
#

FROM debian:buster-20200607

# Default user.
ARG UID=5988
ARG GID=5988
# Default p2rank version.
ARG P2RANK_DOWNLOAD_URL=https://github.com/rdk/p2rank/releases/download/2.2/p2rank_2.2.tar.gz

#

RUN apt-get update \
 && apt-get -y --no-install-recommends install \
 wget curl \
 python2 python-numpy \
 python3 python3-pip \
 openjdk-11-jre-headless \
 libgomp1

RUN addgroup --gid ${GID} user \
 && useradd --uid ${UID} --gid ${GID} user

RUN mkdir /opt/conservation && chown user:user /opt/conservation \
 && mkdir /opt/p2rank && chown user:user /opt/p2rank \
 && mkdir /opt/protein-utils && chown user:user /opt/protein-utils \
 && mkdir /opt/prankweb-runtime && chown user:user /opt/prankweb-runtime \
 && mkdir /opt/task-runner && chown user:user /opt/task-runner \
 && mkdir /data && chown user:user /data \
 && mkdir /data/prankweb && chown user:user /data/prankweb

#
# Prepare task runner.

WORKDIR /opt/task-runner
COPY --from=task-runner-build /opt/task-runner/dist ./

#
# Prepare conservation pipeline.

WORKDIR /opt
COPY --from=conservation-build /opt/conservation ./conservation
COPY --from=conservation-build /opt/conservation-software ./conservation-software

#
# Prepare protein-utils.

WORKDIR /opt/protein-utils
COPY --from=protein-utils-build /opt/protein-utils/dist ./

#
# Prepare p2rank.

WORKDIR /opt/p2rank

RUN wget -O p2rank.tar.gz $P2RANK_DOWNLOAD_URL  \
 && tar -xf p2rank.tar.gz \
 && rm p2rank.tar.gz \
 # p2rank archive contains version, we need to get rid of that
 && mv p2rank_* default

#
# Prepare p2rank run script.

COPY ./p2rank/p2rank_default.sh ./default/p2rank.sh
RUN chmod a+x ./default/p2rank.sh 

#
# Prepare p2rank runtime.

WORKDIR /opt/prankweb-runtime
COPY ./runtime ./
RUN pip3 install requests==2.24.0
RUN chmod a+x ./run_p2rank.py

#
# Prepare task runner definitions.

WORKDIR /data/prankweb/
COPY ./task-runner ./templates

#
# Prepare environment variables.

ENV BLASTDB="/data/conservation/blast-database/"
ENV HSSPTDB="/data/conservation/hssp/"

ENV JENSE_SHANNON_DIVERGANCE_DIR="/opt/conservation-software/jense_shannon_divergence/"
ENV PSIBLAST_CMD="/opt/conservation-software/ncbi-blast-2.9.0+/bin/psiblast"
ENV BLASTDBCMD_CMD="/opt/conservation-software/ncbi-blast-2.9.0+/bin/blastdbcmd"
ENV BLASTDMAKEDB_CMD="/opt/conservation-software/ncbi-blast-2.9.0+/bin/makeblastdb"
ENV CDHIT_CMD="/opt/conservation-software/cd-hit-v4.8.1-2019-0228/cd-hit"
ENV MUSCLE_CMD="/opt/conservation-software/muscle3.8.31_i86linux64"
ENV PDB_DIR="/tmp/pdb/"
ENV PDB_CACHE_DIR="/tmp/pdb-cache/"

# Allow import of packages from conservation file.
ENV PYTHONPATH="/opt/conservation"

ENV PROTEIN_UTILS_CMD="/opt/protein-utils/bin/protein-utils"

#
# Final setup.

USER ${UID}:${GID}

# Prepare temporary directories
RUN mkdir ${PDB_DIR} && mkdir ${PDB_CACHE_DIR}

# Port of task runner.
EXPOSE 8020

# Working directory.
WORKDIR /opt/prankweb-runtime

CMD [ \
    "/opt/task-runner/bin/task-runner-cli", \
    "--TemplatesDirectory=/data/prankweb/templates", \
    "--TaskDirectory=/data/prankweb/task/database", \
    "--WorkingDirectory=/data/prankweb/task/working", \
    "--WorkerCount=2", \
    "--HttpPort=8020" \
]
