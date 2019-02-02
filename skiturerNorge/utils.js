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
    saveTiles: function (tileUrls) {
        var self = this;
        var promises = [];

        for (var i = 0; i < tileUrls.length; i++) {
            var tileUrl = tileUrls[i];

            (function (i, tileUrl) {
                promises[i] = new Promise(function (resolve, reject) {
                    var request = new XMLHttpRequest();
                    request.open('GET', tileUrl.url, true);
                    request.responseType = 'blob';
                    request.onreadystatechange = function () {
                        if (request.readyState === XMLHttpRequest.DONE) {
                            if (request.status === 200) {
                                resolve(self._saveTile(tileUrl.key, request.response));
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
            })(i, tileUrl);
        }
        return Promise.all(promises);
    },
    clear: function () {
        return localforage.clear();
    },
    _saveTile: function (key, value) {
        return this._removeItem(key).then(function () {
            return localforage.setItem(key, value);
        });
    },
    _removeItem: function (key) {
        return localforage.removeItem(key);
    },
    confirmDelete:function(){
      var that = this
      confirm('Do you want to delete the current offline map?',function(){
        localforage.clear();
      })
    },
    zoomToBounds:async function(map){
      bounds = await localforage.getItem('bounds')
      map.setView(,10)
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
