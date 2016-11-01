FROM ruby:2.3.1

EXPOSE 3000

#Install Rails
RUN gem install rails

#Install coffee-rails
RUN gem install coffee-rails

#Install nodejs & postgresql
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs postgresql postgresql-contrib

#Run postgresql server, create role & DB
RUN /etc/init.d/postgresql start && su -c "psql -c 'create user root;'" -s /bin/sh postgres && su -c "createdb hoshinplan_dev;" -s /bin/sh postgres

#Clone hoshinplan master
RUN git clone https://github.com/gabriprat/hoshinplan.git /opt/hoshinplan/

#Install gems
RUN bundle install --gemfile=/opt/hoshinplan/Gemfile

#Run server
CMD /etc/init.d/postgresql start; sleep 30; cd /opt/hoshinplan && rails s --binding=*
