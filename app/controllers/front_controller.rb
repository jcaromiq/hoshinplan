class FrontController < ApplicationController

  hobo_controller

  # Require the user to be logged in for every other action on this controller
  # except :index. 
  skip_before_filter :my_login_required, :only => [:index, :sendreminders]
  
  def index
    if !current_user.nil? && !current_user.guest? && current_user.user_companies.empty?
      redirect_to "/first"
    end
  end
 
  def first
    
  end
  
  def sendreminders
    puts "Initiating send remainders job!"
    kpis = User.joins('INNER JOIN "indicators" ON "indicators"."responsible_id" = "users"."id"').where("reminder = true and next_update between current_date-5 and current_date")
    tasks = User.joins('INNER JOIN "tasks" ON "tasks"."responsible_id" = "users"."id"').where("reminder = true and deadline between current_date-5 and current_date and status = 'active'")
    (kpis | tasks).each { |user|
      UserCompanyMailer.reminder(user, "You have KPIs or tasks to update!", 
      "You can access all the KPIs and tasks you have to update at your dashboard:").deliver
    }
    render "index"
  end

  def summary
    if !current_user.administrator?
      redirect_to user_login_path
    end
  end

  def search
    if params[:query]
      site_search(params[:query])
    end
  end

end
