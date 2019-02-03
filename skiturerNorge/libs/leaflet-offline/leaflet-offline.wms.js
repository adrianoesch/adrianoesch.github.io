(function (factory, window) {

    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else if (typeof window !== 'undefined') {
        if (typeof window.L === 'undefined') {
            throw 'Leaflet must be loaded first!';
        }
        factory(window.L);
    }
}(function (L) {

	/**
	 * The Offline Layer should work in the same way as the Tile Layer does
	 * when there are no offline tile images saved.
	 */

	 L.TileLayer.WMS.Offline = L.TileLayer.extend({

	  // @section
	  // @aka TileLayer.WMS options
	  // If any custom options not documented here are used, they will be sent to the
	  // WMS server as extra parameters in each request URL. This can be useful for
	  // [non-standard vendor WMS parameters](http://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
	  defaultWmsParams: {
	    service: 'WMS',
	    request: 'GetMap',

	    // @option layers: String = ''
	    // **(required)** Comma-separated list of WMS layers to show.
	    layers: '',

	    // @option styles: String = ''
	    // Comma-separated list of WMS styles.
	    styles: '',

	    // @option format: String = 'image/jpeg'
	    // WMS image format (use `'image/png'` for layers with transparency).
	    format: 'image/jpeg',

	    // @option transparent: Boolean = false
	    // If `true`, the WMS service will return images with transparency.
	    transparent: false,

	    // @option version: String = '1.1.1'
	    // Version of the WMS service to use
	    version: '1.1.1'
	  },

	  options: {
	    // @option crs: CRS = null
	    // Coordinate Reference System to use for the WMS requests, defaults to
	    // map CRS. Don't change this if you're not sure what it means.
	    crs: null,

	    // @option uppercase: Boolean = false
	    // If `true`, WMS request parameter keys will be uppercase.
	    uppercase: false
	  },

	  initialize: function (url, tilesDb, options) {
	    this._url = url;
	    this._tilesDb = tilesDb;

	    var wmsParams = JSON.parse(JSON.stringify(this.defaultWmsParams));

	    // all keys that are not TileLayer options go to WMS params
	    for (var i in options) {
	      if (!(i in this.options)) {
	        wmsParams[i] = options[i];
	      }
	    }

	    options = L.Util.setOptions(this, options);

			if (typeof options.subdomains === 'string') {
					options.subdomains = options.subdomains.split('');
			}

	    var realRetina = options.detectRetina && retina ? 2 : 1;
	    var tileSize = this.getTileSize();
	    wmsParams.width = tileSize.x * realRetina;
	    wmsParams.height = tileSize.y * realRetina;

	    this.wmsParams = wmsParams;
	  },

	  onAdd: function (map) {

	    this._crs = this.options.crs || map.options.crs;
	    this._wmsVersion = parseFloat(this.wmsParams.version);

	    var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
	    this.wmsParams[projectionKey] = this._crs.code;

	    L.TileLayer.prototype.onAdd.call(this, map);
	  },
		_tileCoordsToNwSe: function (coords) {
			var map = this._map,
			    tileSize = this.getTileSize(),
			    nwPoint = coords.scaleBy(tileSize),
			    sePoint = nwPoint.add(tileSize),
			    nw = map.unproject(nwPoint, coords.z),
			    se = map.unproject(sePoint, coords.z);
			return [nw, se];
		},
		toBounds:function(a, b) {
			if (!a) { return; }

			var points = b ? [a, b] : a;

			for (var i = 0, len = points.length; i < len; i++) {
				L.Util.extend(points[i]);
			}
			return points
		},
		getWMRTileUrlRaw:function(coords){
			var tileBounds = this._tileCoordsToNwSe(coords),
					crs = this._crs,
					bounds = L.bounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])),
					min = bounds.min,
					max = bounds.max,
					bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ?
					[min.y, min.x, max.y, max.x] :
					[min.x, min.y, max.x, max.y]).join(','),
					url = L.TileLayer.prototype.getTileUrl.call(this, coords);
			url = url + L.Util.getParamString(this.wmsParams, url, this.options.uppercase) +
						(this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox
			return url;
		},
	  getTileUrl: function (coords) {
			var url = this.getWMRTileUrlRaw(coords)
			var dbStorageKey = this._getStorageKey(url);
			var resultPromise = this._tilesDb.getItem(dbStorageKey).then(function (data) {
	        if (data && typeof data === 'object') {
	            return URL.createObjectURL(data);
	        }
	        return url;
	    }).catch(function (err) {
	        throw err;
	    });
	    return resultPromise;
	  },
		getTileUrls: function (bounds, zoom) {
				var tiles = [];
				var originalurl = this._url;

				// this.setUrl(this._url.replace('{z}', zoom), true);

				var tileBounds = L.bounds(
						bounds.min.divideBy(this.getTileSize().x).floor(),
						bounds.max.divideBy(this.getTileSize().x).floor()
				);

				for (var i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
						for (var j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
								var tilePoint = new L.Point(i, j);
                tilePoint.z=zoom
								var url = this.getWMRTileUrlRaw(tilePoint);
								tiles.push({
										'key': this._getStorageKey(url),
										'url': url,
								});
						}
				}
				// this.setUrl(originalurl, true);
				return tiles;
		},

	  // @method setParams(params: Object, noRedraw?: Boolean): this
	  // Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
	  setParams: function (params, noRedraw) {

			params = L.Util.setOptions(this.wmsParams, params);

	    if (!noRedraw) {
	      this.redraw();
	    }

	    return this;
	  },
	  _getStorageKey: function (url) {
	      var key = null;
				key=url
	      // if (url.indexOf('{s}')) {
	      //     var regexstring = new RegExp('[' + this.options.subdomains.join('|') + ']\.');
	      //     key = url.replace(regexstring, this.options.subdomains['0'] + '.');
	      // }

	      return key || url;
	  },
		/**
		 * Overrides the method from the Tile Layer. Loads a tile given its
		 * coordinates.
		 *
		 * @param {Object} coords Coordinates of the tile.
		 * @param {Function} done A callback to be called when the tile has been
		 * loaded.
		 * @returns {HTMLElement} An <img> HTML element with the appropriate
		 * image URL.
		 */
		createTile: function (coords, done) {
				var tile = document.createElement('img');

				L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
				L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

				if (this.options.crossOrigin) {
						tile.crossOrigin = '';
				}

				tile.alt = '';

				tile.setAttribute('role', 'presentation');

        this.getTileUrl(coords).then(function (url) {
						tile.src = url;
				}).catch(function (err) {
						throw err;
				});

				return tile;
		},
		countTiles: function(bounds,map){
				var self = this;
				var zoomLevels = [];

				var currentZoom = map._zoom;
				var latlngBounds = bounds;

				for (var zoom = currentZoom; zoom <= this.options.maxZoomOffline; zoom++) {
						zoomLevels.push(zoom);
				}

				var nTiles=0
				for (var i = 0; i < zoomLevels.length; i++) {
						bounds = L.bounds(map.project(latlngBounds.getNorthWest(), zoomLevels[i]),
								map.project(latlngBounds.getSouthEast(), zoomLevels[i]));
						var tileBounds = L.bounds(
								bounds.min.divideBy(this.getTileSize().x).floor(),
								bounds.max.divideBy(this.getTileSize().x).floor()
						);
						let zoomTiles = self.getTileUrls(bounds, zoomLevels[i]);
						nTiles = nTiles+zoomTiles.length

				}
				return(nTiles)
		},
		saveBoundsTiles: function (bounds,map,updateProgress=null,callback) {
			var self = this;
			var zoomLevels = [];
			var tileUrls = [];
			var currentZoom = map._zoom;
			var latlngBounds = bounds;
			self._tilesDb.setBounds(bounds);

			for (var zoom = currentZoom; zoom <= this.options.maxZoomOffline; zoom++) {
					zoomLevels.push(zoom);
			}

			for (var i = 0; i < zoomLevels.length; i++) {
					bounds = L.bounds(map.project(latlngBounds.getNorthWest(), zoomLevels[i]),
							map.project(latlngBounds.getSouthEast(), zoomLevels[i]));
					tileUrls = tileUrls.concat(self.getTileUrls(bounds, zoomLevels[i]));
			}
			self.fire('offline:save-start', {
					nTilesToSave: tileUrls.length
			});
			self._tilesDb.saveTiles(tileUrls,bounds,updateProgress).then(function () {
					callback.call()
			}).catch(function (err) {
					self.fire('offline:save-error', {
							error: err
					});
			});
		},
	});

	/**
	 * Factory function as suggested by the Leaflet team.
	 *
	 * @param {String} url URL of the tile map provider.
	 * @param {Object} tilesDb An object that implements a certain interface
	 * so it's able to serve as the database layer to save and remove the tiles.
	 * @param {Object} options This is the same options parameter as the Leaflet
	 * Tile Layer, there are no additional parameters. Check their documentation
	 * for up-to-date information.
	 */
	L.tileLayer.wms.offline = function (url, tilesDb, options) {
			return new L.TileLayer.WMS.Offline(url, tilesDb, options);
	};
}, window));
