# Be sure to restart your server when you modify this file.

#Defined for every environment to avoid memcached dependence at development
#Hoshinplan::Application.config.session_store ActionDispatch::Session::CacheStore, :expire_after => 15.days, :domain => :all


# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rails generate session_migration")
# Hoshinplan::Application.config.session_store :active_record_store
