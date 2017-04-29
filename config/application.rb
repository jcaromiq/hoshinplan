require File.expand_path('../boot', __FILE__)

require 'rails/all'
require 'wicked_pdf'
require 'sprockets/railtie'

require File.expand_path('../../config/jobs/base_job.rb',        __FILE__)
Dir['config/jobs/*.rb'].each {|file| require File.expand_path('../../' + file, __FILE__)}

Bundler.require(:default, Rails.env)

module Hoshinplan
  class Application < Rails::Application
    # Hobo: the admin subsite loads admin.css & admin.js
    config.assets.precompile += %w(admin.css admin.js)
    config.assets.precompile << "emoji/**/*.png"
    # Hobo: Named routes have changed in Hobo 2.0.   Set to false to emit both the 2.0 and 1.3 names.
    config.hobo.dont_emit_deprecated_routes = true
    # Hobo: remove support for ERB templates
    config.hobo.dryml_only_templates = true
    # Hobo: the front subsite loads front.css & front.js
    config.assets.precompile += %w(pdf.css front.css front.js history.js history.css billing.js)
  
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    # config.autoload_paths += %W(#{config.root}/extras)
    config.autoload_paths += %W(#{config.root}/jobs)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    config.time_zone = 'Europe/Berlin'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    config.i18n.default_locale = :es

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable escaping HTML in JSON.
    config.active_support.escape_html_entities_in_json = true

    # Use SQL instead of Active Record's schema dumper when creating the database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Enable the asset pipeline
    # config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '2.0'

    config.assets.initialize_on_precompile = false
    
    I18n.config.enforce_available_locales = true
    
    config.assets.paths << Rails.root.join('app', 'assets', 'fonts')
    config.assets.paths << Emoji.images_path
    
    config.font_assets.origin = '*'
    
    config.assets.image_optim = false
    
    config.cms_auto_calls = !ENV['CMS_AUTO_CALLS'].blank? && YAML.load(ENV['CMS_AUTO_CALLS'])
    config.new_relic_disable = !ENV['NEW_RELIC_DISABLE'].blank? && YAML.load(ENV['NEW_RELIC_DISABLE'])
    config.mixpanel_disable = !ENV['MIXPANEL_DISABLE'].blank? && YAML.load(ENV['MIXPANEL_DISABLE'])
    config.ssl_disable = !Rails.env.production? || !ENV['DISABLE_SSL'].blank? && YAML.load(ENV['DISABLE_SSL'])
    
    
    config.active_record.raise_in_transactional_callbacks = true
    
    config.active_job.queue_adapter = :resque
  end
end

def ll(text)
  "#{DateTime.now.to_s} #{text}\n"
end

