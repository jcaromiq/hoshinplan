class HoboMigration28 < ActiveRecord::Migration
  def self.up
    change_column :users, :preferred_view, :string, :limit => 255, :default => :expanded

    add_column :payments, :product, :string
  end

  def self.down
    change_column :users, :preferred_view, :string, default: "expanded"

    remove_column :payments, :product
  end
end
