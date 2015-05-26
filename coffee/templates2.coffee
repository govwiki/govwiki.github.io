
###
# file: templates2.coffee ----------------------------------------------------------------------
#
# Class to manage templates and render data on html page.
#
# The main method : render(data), get_html(data)
#-------------------------------------------------------------------------------------------------
###



# LOAD FIELD NAMES 
fieldNames = {}


render_field_value =(n,data) ->
  v=data[n]
  if not data[n]
    return ''

  if n == "web_site"
    return "<a target='_blank' href='#{v}'>#{v}</a>"
  else
    return v
  
  

render_field_name = (fName) ->
  if fieldNames[fName]?
    return fieldNames[fName]

  s = fName.replace(/_/g," ")
  s = s.charAt(0).toUpperCase() + s.substring(1)
  return s


render_field = (fName,data)->
  #return ''  unless fValue = data[fName]
  """
  <div>
      <span class='f-nam'>#{render_field_name fName}</span>
      <span class='f-val'>#{render_field_value(fName,data)}</span>
  </div>
  """

  
render_fields = (fields,data,template)->
  h = ''
  for field,i in fields
    fValue = render_field_value field, data
    if ('' != fValue)
      fName = render_field_name field
      h += template(name: fName, value: fValue)
  return h


under = (s) -> s.replace(/[\s\+\-]/g, '_')


render_tabs = (initial_layout, data, templates) ->
  layout = add_other_tab_to_layout initial_layout, data

  layout_data =
    title: data.gov_name,
    tabs: [],
    tabcontent: ''
  
  for tab,i in layout
    layout_data.tabs.push
      tabid: under(tab.name),
      tabname: tab.name,
      active: (if i>0 then '' else 'active')

  for tab,i in layout
    detail_data =
      tabid: under(tab.name),
      tabname: tab.name,
      active: (if i>0 then '' else 'active')
      tabcontent: ''
    switch tab.name
      when 'Overview + Elected Officials'
        for official,i in data.elected_officials.record
          official_data =
            title: "Title: " + official.title,
            name: official.full_name,
            email: official.email_address
            termexpires: official.term_expires
          official_data.image = '<img src="'+official.photo_url+'" alt="" />' if '' != official.photo_url
          detail_data.tabcontent += templates['tabdetail-official-template'](official_data)
      else
        detail_data.tabcontent += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
    layout_data.tabcontent += templates['tabdetail-template'](detail_data)
  return templates['tabpanel-template'](layout_data)


get_layout_fields = (la) ->
  f = {}
  for t in la
    for field in t.fields
      f[field] = 1
  return f

get_record_fields = (r) ->
  f = {}
  for field_name of r
    f[field_name] = 1
  return f

get_unmentioned_fields = (la, r) ->
  layout_fields = get_layout_fields la
  record_fields = get_record_fields r
  unmentioned_fields = []
  unmentioned_fields.push(f) for f of record_fields when not layout_fields[f]
  return unmentioned_fields


add_other_tab_to_layout = (layout=[], data) ->
  #clone the layout
  l = $.extend true, [], layout
  t =
    name: "Other"
    fields: get_unmentioned_fields l, data

  l.push t
  return l


# converts tab template described in google fusion table to 
# tab template
convert_fusion_template=(templ) ->
  tab_hash={}
  tabs=[]
  # returns hash of field names and their positions in array of field names
  get_col_hash = (columns) ->
    col_hash ={}
    col_hash[col_name]=i for col_name,i in templ.columns
    return col_hash
  
  # returns feild value by its name, array of fields, and hash of fields
  val = (field_name, fields, col_hush) ->
    fields[col_hash[field_name]]
  
  # converts hash to an array template
  hash_to_array =(hash) ->
    a = []
    for k of hash
      tab = {}
      tab.name=k
      tab.fields=hash[k]
      a.push tab
    return a

    
  col_hash = get_col_hash(templ.col_hash)
  
  for row,i in templ.rows
    category = val 'general_category', row, col_hash
    #tab_hash[category]=[] unless tab_hash[category]
    fieldNames[val 'field_name', row, col_hash]=val 'description', row, col_hash
    if category
      tab_hash[category]?=[]
      tab_hash[category].push val 'field_name', row, col_hash

  tabs = hash_to_array(tab_hash)
  return tabs


class Templates2

  @list = undefined
  @templates = {}

  constructor:() ->
    @list = []
    templateList = ['tabpanel-template', 'tabdetail-template', 'tabdetail-namevalue-template', 'tabdetail-official-template'];
    templatePartials = ['tab-template'];
    @templates = {}
    for template,i in templateList
      @templates[template] = Handlebars.compile($('#' + template).html())
    for template,i in templatePartials
      Handlebars.registerPartial(template, $('#' + template).html())

  add_template: (layout_name, layout_json) ->
    @list.push
      name:layout_name
      templates: @templates
      render:(dat) ->
        render_tabs(layout_json, dat, @templates)


  load_template:(template_name, url) ->
    $.ajax
      url: url
      dataType: 'json'
      cache: true
      success: (template_json) =>
        @add_template(template_name, template_json)
        return

  load_fusion_template:(template_name, url) ->
    $.ajax
      url: url
      dataType: 'json'
      cache: true
      success: (template_json) =>
        t = convert_fusion_template template_json
        console.log t
        @add_template(template_name, t)
        return


  get_names: ->
    (t.name for t in @list)

  get_index_by_name: (name) ->
    for t,i in @list
      if t.name is name
        return i
     return -1

  get_html: (ind, data) ->
    if (ind is -1) then return  ""
    
    if @list[ind]
      return @list[ind].render(data)
    else
      return ""



module.exports = Templates2
