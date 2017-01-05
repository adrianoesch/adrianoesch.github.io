var canv = {
  tabs: function(evt) {
    hist.remove()
    srcClasses = evt.srcElement.className.split(' ')
    if(srcClasses.indexOf('measureTab')>=0){
      d3.selectAll('.measureTab').classed('active',false)
      d3.selectAll('#'+evt.srcElement.id).attr('class','measureTab active')
    }else{
      d3.selectAll('.timeTab').classed('active',false)
      d3.selectAll('#'+evt.srcElement.id).attr('class','timeTab active')
    }
    this.data()
  },
  data: function(){
    measure = $('.measureTab.active')[0].id
    time = $('.timeTab.active')[0].id

    cms = []
    if(measure == 'mdp'){
      for(i=0;i<coords.length;i++){
        cms.push(funs[measure](seasons.map(function(s){return d2[coords[i]][time][s]|| 0})))
      }
    }else{
      for(i=0;i<coords.length;i++){
        cms.push(funs[measure](seasons.map(function(s){return d[coords[i]][time][s] || 0 })))
      }
    }
    flatCms = [].concat.apply([],cms)
    maxVal = math.max(flatCms)
    minVal = math.min(flatCms)
    this.scale.adjust(maxVal,minVal,measure)
    colorRange = this.getColorRange(maxVal,minVal)
    for(i=0;i<coords.length;i++){
      var div = $('#'+coords[i])
      div.css('background-color',colorRange(cms[i]))
      div.css('opacity','.8')
      $('#'+coords[i]+' .detailtext').html('<span>'+math.round(cms[i],2).toString()+(measure=='mdp'?' ':' cm')+'</span>')
    }
  },
  getColorRange : function(maxVal,minVal){
    minVal = minVal || 0;
    var colorRange = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([lowRGB, highRGB]);
    return colorRange
  },
  scale : {
    get : function(maxVal){
      var w = 140, h = 540;
    	var key = d3.select("#scale").append("svg").attr("width", w).attr("height", h);
    	var legend = key.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
    	legend.append("stop").attr("offset", "0%").attr("stop-color", highRGB).attr("stop-opacity", 0.9);
    	legend.append("stop").attr("offset", "100%").attr("stop-color", lowRGB).attr("stop-opacity", 0.9);
    	key.append("rect").attr("width", w - 100).attr("height", h - 100).style("fill", "url(#gradient)").attr("transform", "translate(0,10)");
    	var y = d3.scaleLinear().range([maxVal, 0]).domain([1, maxVal]);
    },
    adjust : function(maxVal, minVal,measure){
      minVal = minVal ||0;
    	var key = d3.select("svg");
      d3.select('g').remove()
      d3.select('text').remove()
    	var y = d3.scaleLinear().range([439, 0]).domain([0, maxVal]);
    	var yAxis = d3.axisRight().scale(y);
    	key.append("g").attr("class", "y axis").attr("transform", "translate(41,10)").call(yAxis)
      key.append("text").attr("transform", "rotate(-90)").attr("y", 70).attr("x", -10).attr("dy", ".78em").style("text-anchor", "end").text(measure == 'mdp'?'MDP':"cm");
    }
  }
};

var hist = {
  pop: function(evt){
    srcId = evt.srcElement.id
    try{
      this.remove()
    }catch(err){}

    d3.select('#'+srcId.toString()).attr('class','activeCell cell')
    var hist = d3.select('#canvas')
      .append('div')
      .attr('id','hist')
      .attr('style','top:'+(evt.pageY-280).toString()+';left:'+(evt.pageX-200).toString()+';')

    var svg = hist.append('svg')
      .attr('class','histSvg')

    hist.append('div')
      .attr('id','close')
      .attr('onclick','hist.remove()')

    hist.append('div')
      .attr('class','histTitle')
      .html('Histogram')

    var g = svg.append("g")

  measure = $('.measureTab.active')[0].id
  time = $('.timeTab.active')[0].id
  var data = seasons.map(function(i){return d[srcId][time][i]})

  var height = 130
  var width = 230

  var formatCount = d3.format("0f");
  var maxX = time == 'overall' ? 700 : 200;

  var x = d3.scaleLinear()
      .domain([0,maxX])
      .rangeRound([0, width]);

  var bins = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks( time == 'overall' ? 8 : 5))
      (data);

  var maxY = math.max(bins.map(function(i) {return i.length}))

  var y = d3.scaleLinear()
      .domain([0,maxY+1])
      .range([height, 0]);

  var bar = g.selectAll(".bar")
    .data(bins)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
      .attr("height", function(d) { return height - y(d.length); });

  g.append("g")
      .attr("class", "histAxis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(8));

  g.append("g")
      .attr("class", "histAxis axis--y")
      .call(d3.axisLeft(y).ticks(4));

  },
  remove : function(){
    try{
      d3.select('#hist').remove()
      d3.selectAll('.cell').attr('class','cell')
    }catch(err){}
  }
};


var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
var coords = ['G26','G24','G25','G22','G23','G20','G21','O29','O26','O27','O24','O22','O23','G9','G8','E9','O16','O15','O14','O13','O12','O11','J27','J26','J25','J24','J23','J22','J21','J20','J29','J28','M3','M9','M8','P10','P11','P12','P13','P14','P15','P16','P19','H18','H19','M28','M29','O28','S9','S8','O20','O21','E24','E25','E26','G10','O17','F9','O19','L32','L30','L31','K31','K30','K32','Q14','L4','L9','O10','R7','R8','R9','Q15','E8','J32','F10','F11','N12','N13','N10','N11','N16','N17','N14','N15','N18','N19','P24','P27','P21','P20','P23','P22','H25','H24','H26','H21','H20','H23','H22','K5','Q11','Q10','L27','L26','L29','L28','Q19','M11','M10','M13','M12','M15','M14','M17','M16','M19','M18','Q7','E10','I17','K28','K22','K20','K21','K26','K27','K24','S22','F23','F22','F26','F25','F24','N29','N28','N23','N22','N21','N20','N27','N26','N25','N24','J5','J6','L18','L19','L14','L15','L16','L17','L10','L11','L12','L13','T14','T10','T11','K13','M24','M25','M26','M27','P7','M20','P8','P9','K12','M21','M22','M23','Q20','Q21','Q22','Q23','I20','I21','I22','I23','I26','I27','S13','S12','S11','S10','S15','S14','Q9','Q8','I7','I6','I28','K11','O9','O8','K17','O2','K16','K15','K14','K19','K18','I24','I25','M32','M30','K29','R16','R14','R15','R12','R13','R10','R11','K23','Q13','K25','H8','H9','H7','Q12','L21','L20','L23','L22','L25','L24','J18','J19','J16','J17','J14','J15','J13','I19','I15','I16','N8','N9','N2','N3','T9','R23','R22','R20']
var months = ['dec','jan','feb','mar','apr'];
var cellSize = 20;
var seasons = [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]

var lowRGB = "rgb(190,250,230)"
var highRGB = "rgb(0,50,160)"

var canvas = d3.select('#canvas')
var c2i = {};

for(i=0;i<22*34;i++){
  var f = Math.floor(i/34)
  var coordi = alphabet[f]+(i-f*34).toString();
  c2i[coordi]= i;
  canvas.append('div')
        .attr('class','cell')
        .attr('id',coordi)
        .style('background-color','black')
        .style('opacity','0.05')
        .style('z-index',(800-i).toString())
}
for(i=0;i<coords.length;i++){
  d3.select('#'+coords[i])
    .attr('onclick','hist.pop(event)')
    .append('div')
    .attr('class','detailtext')
}


var d = {};
var d2 = {};
var maxs = {};

var funs = {
  max : math.max,
  min : math.min,
  median : math.median,
  mean : math.mean,
  mdp : math.mean
};

d3.csv('monthlySums3.csv',function(data){

  data.forEach(function(i){
    if(typeof d[i.coord]=='undefined'){
      d[i.coord] = {};
      d2[i.coord] = {};
    }
    if(typeof d[i.coord][i.month.toLowerCase()]=='undefined'){
      d[i.coord][i.month.toLowerCase()] = {};
      d2[i.coord][i.month.toLowerCase()] = {};
    }
    d[i.coord][i.month.toLowerCase()][+i.season] = +i.cm
    d2[i.coord][i.month.toLowerCase()][+i.season] = +i.dump>1?1:0;
  });

  coords.map(function(c){
      d[c]['overall'] = {};
      d2[c]['overall'] = {};
      seasons.map(function(y){
            d[c]['overall'][y] =  math.sum(months.map(function(m){
              return d[c][m][y]||0 }));
            d2[c]['overall'][y] =  math.sum(months.map(function(m){
              return d2[c][m][y]||0 }))>1?1:0;
          })
      });


  canv.scale.get(100)
  canv.data()
});
