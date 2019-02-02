var tilesDb = {
    getItem: function (key) {
        return localforage.getItem(key);
    },
    setBounds:function(bounds){
      localforage.setItem('bounds', bounds)
    },
    getBounds: async function (bounds){
      return await localforage.getItem('bounds')
    },
    saveTiles: function (tileUrls,bounds,updateProgress=null) {
        var self = this;
        var promises = [];
        var nTiles = tileUrls.length
        var update = updateProgress;
        update('1%')

        for (var i = 0; i < tileUrls.length; i++) {
            var tileUrl = tileUrls[i];

            (function(i,tileUrl,nTiles,update){
                promises[i] = new Promise( function (resolve, reject) {
                  var request = new XMLHttpRequest();
                  request.open('GET', tileUrl.url, true);
                  request.responseType = 'blob';
                  request.onreadystatechange = function () {
                      if (request.readyState === XMLHttpRequest.DONE) {
                          if (request.status === 200) {
                              resolve(self._saveTile(tileUrl.key, request.response,nTiles,update));
                          } else {
                              reject({
                                  status: request.status,
                                  statusText: request.statusText
                              });
                          }
                      }
                  };
                  request.send();
              });
            })(i,tileUrl,nTiles,update)
        }
        return Promise.all(promises);
    },
    clear: function () {
        return localforage.clear();
    },
    _saveTile: async function (key, value,nTiles,update) {
      await this._removeItem(key).then(function () {
          return localforage.setItem(key, value);
      });
      let i = await localforage.length();
      let updateStr = Math.round(((i-1)/nTiles)*100).toString()+'%';
      update(updateStr)
      return
    },
    _removeItem: function (key) {
        return localforage.removeItem(key);
    },
    confirmDelete:function(){
      var that = this
      if(confirm('Do you want to delete the current offline map?')){
        localforage.clear();
      }
    },
    zoomToBounds:async function(){
      bounds = await localforage.getItem('bounds')
      map.fitBounds([[bounds._southWest.lat,bounds._southWest.lng],[bounds._northEast.lat,bounds._northEast.lng]])
    }
};

function turPopup(tur){
    return("<div><a target='_bank' href='"+tur.href+"'>"+tur.name+"</a></div>")
};

function hyttaPopup(tur){
    return("<div><a target='_bank' href='"+tur.href+"'>"+tur.name+" ("+tur.type+")</a></div>")
};

function addTur(tur){
  L.polyline( tur.points, {
    weight:2,
    color:'rgb(0, 140, 255)',
  }).bindPopup(turPopup(tur)).on('mouseover', function (e) {
    e.target.setStyle({
      weight:4,
      color:'rgb(2, 119, 215)',
    });
  }).on('mouseout', function (e) {
    e.target.setStyle({
      weight:2,
      color:'rgb(0, 140, 255)',
    })
  }).addTo(map)
};

function addHytta(hytta){
    L.marker( hytta.points,{
      weight:3,
      color:'rgb(162, 0, 0)'
    }).bindPopup(hyttaPopup(hytta)).addTo(map)
}
