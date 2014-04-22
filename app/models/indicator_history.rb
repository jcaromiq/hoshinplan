class IndicatorHistory < ActiveRecord::Base

  hobo_model # Don't put anything above this
  
  include ModelBase

  fields do
    value :decimal
    goal  :decimal
    day   :date
    timestamps
  end
  attr_accessible :value, :goal, :indicator, :indicator_id, :day, :creator_id
  
  belongs_to :creator, :class_name => "User", :creator => true
  
  belongs_to :company

  belongs_to :indicator, :inverse_of => :indicator_histories, :counter_cache => false

  belongs_to :responsible, :class_name => "User", :inverse_of => :indicator_histories  

  validates_uniqueness_of :day, :scope => [:indicator_id]
  
  before_create do |ih|
    ih.company = ih.indicator.company
  end
  
  after_save do |ih|
    update_indicator(ih)
  end

  before_destroy do |ih|
    update_indicator(ih, destroy=true)
  end
  
  def update_indicator(ih, destroy=false)
    ind = Indicator.find(ih.indicator_id)
    latest = IndicatorHistory.where("indicator_id = ? and day <= ? and id != ?", 
                                    ind.id, Date.today, destroy ? ih.id : -1).order("day desc").first
                                    
    if (!latest.nil? && (
          ind.value.nil? || 
          (destroy && !ind.last_update.nil? && ind.last_update == ih.day)  || 
          (!ind.last_update.nil? && ind.last_update <= latest.day)
      ))
      ind.update_column(:value, latest.value)
      ind.update_column(:goal, latest.goal)
      ind.update_column(:last_update, latest.day)      
    end
    
  end

  # --- Permissions --- #

  def create_permitted?
    same_comp-1
  end

  def update_permitted?
    indicator.update_permitted?
  end

  def destroy_permitted?
    indicator.destroy_permitted?
  end

  def view_permitted?(field)
    indicator.view_permitted?
  end

end
