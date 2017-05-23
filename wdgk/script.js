var inputChange = function(){
  var files = $('input')[0].files;
  if(files[0].name.search('takeout')>=0){
    if(files[0].name.search('zip')>=0){
      var zip = new JSZip();
      zip.loadAsync(files[0]).then(function(zip){
        runAnalyses(zip);
      });
    }else{
      alert('The selected file does not end with ".zip".');
    }
  }else{
    alert('The selected file is not a Google take out file.');
  }
};


var runAnalyses = function(zip){
  // make sure results are empty before adding analyses
  $('#results').html('')

  // title with user account
  zip.files['Takeout/index.html'].async('string').then(function(htmlStr){
    $html = $(htmlStr);
    var user = $html.find('h1')[0].innerHTML.split(' ').filter(function(item){return item.indexOf('@')>=0})[0];
    $('#results').append('<h2>Results for '+user+'</h2>');
  })

  // analyse browser history
  if(Object.keys(zip.files).indexOf('Takeout/Chrome/BrowserHistory.json')>=0){
    zip.files['Takeout/Chrome/BrowserHistory.json'].async('string').then(function(jsonStr){
      $('#results').append('<h3>Browser History:</h3>');
      var d = JSON.parse(jsonStr)['Browser History'];
      browser.init(d);
    })
  };

  // more analyses to be added, point to Github
  $('#footer').css({'visibility':'visible'})

};

var utils = {
  setUpperLimit : function(arr,round){
    var max = d3.max(arr);
    return Math.ceil(max/round)*round;
  },
  layout : {
    default : {
      width: 600,
      height: 400,
      margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 100,
        pad: 1
      }
    }
  }
};

var d = {};

var browser = {
  loadDev : function(){
    // load data in console for development
    d3.json("./BrowserHistory.json", function(data) {
      d = data['Browser History'];
    })
  },
  avgDailyVisitsPerMonth : function(d){
    // prepare data
    var daysPerMonth = {"Jan":31, "Feb":28, "Mar":31, "Apr":30, "May":31, "Jun":30, "Jul":31,
        "Aug":31, "Sep":30, "Oct":31, "Nov":30, "Dec":31};
    var months = Object.keys(daysPerMonth);
    var t = d.map(function(i){
      i.date = new Date(i.time_usec/1000);
      return i;
    })
    var visitsPerMonth = d3.nest().key(function(i){
      return months[i.date.getMonth()]+' '+i.date.getFullYear().toString();
      })
      .rollup(function(v){ return v.length;}).entries(t)
    var avgDailyVisitsPerMonth = visitsPerMonth.map(function(i){
      i.month = i.key.split(' ')[0];
      i.value = i.value/daysPerMonth[i.month];
      return i;
    }).sort(function(a,b){return new Date(a.key)-new Date(b.key)})

    // plot
    $('#results').append('<div id="avgDailyVisitsPerMonth" class="plots"></div>')
    Plotly.plot(
      document.getElementById('avgDailyVisitsPerMonth') ,
      [{
        x: avgDailyVisitsPerMonth.map(function(i){return(i.key)}),
        y: avgDailyVisitsPerMonth.map(function(i){return(i.value)})
      }],
      Object.assign({
        title : 'Average Daily Visits per Month',
        yaxis: {
          range: [0, utils.setUpperLimit(avgDailyVisitsPerMonth.map(function(i){return(i.value)}),50)],
          title : 'Avg Daily Visits'
        }
      },utils.layout.default)
    );
  },
  avgDailyVisitsPerWeekDay : function(d){
    // prepare data
    var weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var t = d.map(function(i){
      i.date = new Date(i.time_usec/1000)
      i.dateStr = i.date.getDay()+'/'+i.date.getMonth()+'/'+i.date.getFullYear()
      i.weekday = weekdays[i.date.getDay()]
      return i
    })
    var nWeeks = (d[0].time_usec - d[d.length-1].time_usec) / 1000000 /60 /60 / 24 / 7
    var weekdaysOrdered = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var avgDailyVisitsPerWeekDay = d3.nest().key(function(i){return i.weekday})
      .sortKeys((function(a,b) { return weekdaysOrdered.indexOf(a) - weekdaysOrdered.indexOf(b); }))
      .rollup(function(v){
        return v.length/nWeeks;
      }).entries(t)

    // plot
    $('#results').append('<div id="avgDailyVisitsPerWeekDay" class="plots"></div>')
    Plotly.plot(
      document.getElementById('avgDailyVisitsPerWeekDay') ,
      [{
        x: avgDailyVisitsPerWeekDay.map(function(i){return(i.key)}),
        y: avgDailyVisitsPerWeekDay.map(function(i){return(i.value)})
      }],
      Object.assign({
        title : 'Average Daily Visits per Weekday',
        yaxis: {
          range: [0, utils.setUpperLimit(avgDailyVisitsPerWeekDay.map(function(i){return(i.value)}),50)],
          title : 'Avg Daily Visits'
        }
      },utils.layout.default)
    );
  },
  init : function(d){
      // mention amount of visits and daily average
      var days = Math.round( (d[0].time_usec - d[d.length-1].time_usec) / 1000000 / 60 / 60 / 24 )
      $('#results').append('<p>You have been to '+d.length.toLocaleString()+' websites in '+days.toString()+
        ' days. That\'s an average of '+Math.round(d.length/days).toString()+' visits per day.</p>')
      this.avgDailyVisitsPerMonth(d);
      this.avgDailyVisitsPerWeekDay(d);
  }
};
