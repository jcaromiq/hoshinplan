class UsersController < ApplicationController

  hobo_user_controller
  
  autocomplete
  
  # Allow only the omniauth_callback action to skip the condition that
  # we're logged in. my_login_required is defined in application_controller.rb.
  skip_before_filter :my_login_required, :only => :omniauth_callback
  
  after_filter :update_data, :only => :omniauth_callback
  
  auto_actions :all, :except => [ :index, :new, :create ]
  
  include HoboOmniauth::Controller
  
  # Normally, users should be created via the user lifecycle, except
  #  for the initial user created via the form on the front screen on
  #  first run.  This method creates the initial user.
  def create
    hobo_create do
      if valid?
        self.current_user = this
        flash[:notice] = t("hobo.messages.you_are_site_admin", :default=>"You are now the site administrator")
        redirect_to home_page
      end
    end
  end
  
  def update_data
    auth = request.env["omniauth.auth"]
    authorization = Authorization.find_by_provider_and_uid(auth['provider'], auth['uid'])
    authorization ||= Authorization.find_by_email_address(auth['info']['email'])
    atts = authorization.attributes.slice(*model.accessible_attributes.to_a)
    atts.each { |k, v| 
      atts.delete(k) if !current_user.attributes[k].nil? && !current_user.attributes[k].empty? || v.nil?
    }
    current_user.attributes = atts
    current_user.save!
  end
  
end
