require 'rmagick'

class Array
  def odd_values
    self.values_at(* self.each_index.select {|i| i.odd?})
  end
  def even_values
    self.values_at(* self.each_index.select {|i| i.even?})
  end
end

class DrawController < ApplicationController
  # change a string into a polygon array
  IMGSIZE = 1024
  Rect=Struct.new(:x,:y,:width,:height)
  Point=Struct.new(:x,:y)

  def index
  	render :text => "fail" unless check_params
  end
  

  def upload
  	input_data = params[:data]
    msg = "fail"
  	if verify_polygon_data(input_data) and check_params
      save_polygon_data input_data
  	  msg = "success"
  	end
    render :text => msg
  end

  def save_polygon_data (polyDataStr)
    polygons = get_polygons polyDataStr
    draw_to_canvas polygons
  end

  def draw_to_canvas (polygons)
  	  master_img = Magick::Image.read(get_img_path).first
  	  bounds = get_bound_rect polygons
	  user_img = Magick::Image.new(bounds.width, bounds.height) { self.background_color='none' }
	  ctx = Magick::Draw.new
	  ctx.stroke('black')
	  ctx.fill('none')
	  polygons.each { |points| ctx.polyline(*remap_points(points, bounds)) }
      ctx.draw user_img
      master_img = master_img.composite(user_img, bounds[:x], bounds[:y], Magick::OverCompositeOp)
      master_img.write(get_img_path)
  end

  def get_img_path
  	"app/assets/images/tile" + params[:id] + ".png"
  end

  # helper functions for processing polygon data
  def verify_polygon_data (polyDataStr)
    (polyDataStr =~ /\A((\d+(\.\d+)?,\d+(\.\d+)?\s)+!?)+\Z/)==0
  end

  def get_polygons (strPolygons)
  	a = Array.new()
  	strPolygons.split('!').each { |polygon| a<<get_points(polygon) }
  	return a
  end

  def get_points (strPoints)
    a = Array.new()
    strPoints.split(' ').each { |point| a.push(*(point.split(",").map(&:to_i))) }
    return a
  end

  def remap_points (points, bounds)
  	i=0
  	points.map do |v|
  	  i=1-i
  	  (i==1) ? v-bounds.x : v-bounds.y
  	end
  end

  def get_bound_rect(polygons)
  	left, top = polygons[0][0], polygons[0][1]
  	right, bottom = left, top 

  	polygons.each do |points|
  	  x = points.even_values
  	  y = points.odd_values

  	    left = x.min if x.min < left
  	   right = x.max if x.max > right
  	     top = y.min if y.min < top
  	  bottom = y.max if y.max > bottom
    end
    
    width = right-left+1
    height = bottom-top+1

    return nil unless width>0 and height>0
    
    Rect.new(left,top,width,height)
  
  end

  def check_params
    (1..12).include? params[:id].to_i
  end
end
