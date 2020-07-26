FROM debian:buster-20200607

ARG USER=5988

RUN apt-get update

RUN apt-get -y install \
 wget curl \
 python2 python3 \
 make g++ zlib1g-dev \
 python-numpy \
 openjdk-11-jre-headless

RUN addgroup --gid ${USER} user \
 && useradd --uid ${USER} --gid ${USER} user

RUN mkdir /opt/conservation \
 && chown user:user /opt/conservation \
 && mkdir /opt/p2rank \
 && chown user:user /opt/p2rank

USER ${USER}:${USER}

# conservation pipeline

WORKDIR /opt/conservation

RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.9.0/ncbi-blast-2.9.0+-x64-linux.tar.gz \
 && wget https://github.com/weizhongli/cdhit/releases/download/V4.8.1/cd-hit-v4.8.1-2019-0228.tar.gz \
 && wget http://www.drive5.com/muscle/downloads3.8.31/muscle3.8.31_i86linux64.tar.gz \
 && wget http://compbio.cs.princeton.edu/conservation/conservation_code.tar.gz \
 && tar -xf ncbi-blast-2.9.0+-x64-linux.tar.gz \
 && tar -xf cd-hit-v4.8.1-2019-0228.tar.gz \
 && cd cd-hit-v4.8.1-2019-0228 \
 && make \
 && cd .. \
 && tar -xf muscle3.8.31_i86linux64.tar.gz \
 && tar -xf conservation_code.tar.gz \
 && mv conservation_code
 && rm *.gz

# p2rank

WORKDIR /opt/p2rank

RUN wget https://github.com/rdk/p2rank/releases/download/2.1/p2rank_2.1.tar.gz \
 && tar -xf p2rank_2.1.tar.gz \
 && rm p2rank_2.1.tar.gz

# scripts



# final setup

ENV BLASTDB="/data/conservation/blast-database/"
ENV JENSE_SHANNON_DIVERGANCE_DIR="/opt/conservation/jense_shannon_divergence/"
ENV PSIBLAST_CMD="/opt/conservation/ncbi-blast-2.9.0+/bin/psiblast"
ENV BLASTDBCMD_CMD="/opt/conservation/ncbi-blast-2.9.0+/bin/blastdbcmd"
ENV CDHIT_CMD="/opt/conservation/cd-hit-v4.8.1-2019-0228/cd-hit"
ENV MUSCLE_CMD="/opt/conservation/muscle3.8.31_i86linux64"

VOLUME ["/data/blast-database"]

