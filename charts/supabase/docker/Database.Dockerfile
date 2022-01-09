FROM bitnami/postgresql:12.9.0-debian-10-r40

USER root

RUN install_packages make git gcc libc6-dev
RUN git clone https://github.com/michelp/pgjwt.git
RUN cd pgjwt && make install
RUN git clone https://github.com/eulerto/wal2json.git
RUN cd wal2json && make && make install

USER 1001