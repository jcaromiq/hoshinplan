class AreasController < ApplicationController

  hobo_model_controller

  auto_actions :all, :except => [:new, :index]
  
  show_action :charts
  
  include RestController
  
  cache_sweeper :areas_sweeper
  
  def create
    hobo_create
    log_event("Create area", {objid: @this.id, name: @this.name})
  end
  
  def charts
    @this = Area.includes(:indicators, {:indicators => :indicator_histories})
      .where(:id => params[:id]).order('indicators.ind_pos').references(:indicators).first
    hobo_show
  end
  
end
