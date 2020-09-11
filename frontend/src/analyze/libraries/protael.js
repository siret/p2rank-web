/**
 * Extend SnapSVG Element
 * TODO: check next snapsvg release for native implementations!
 */
Snap.plugin(function (Snap, Element, Paper, glob) {
  "use strict";
  var e = Element.prototype;
  e.toFront = function () {
    return this.appendTo(this.paper);
  };
  e.toBack = function () {
    return this.prependTo(this.paper);
  };
  e.hide = function () {
    /* need both to make sure graphics editors do not display this element */
    return this.attr({
      "visibility": "hidden",
      "display": "none",
    });
  };
  e.show = function () {
    return this.attr({
      "visibility": "visible",
      "display": "inline",
    });
  };
  /*\
     * Element.dragVertical
     [ method ]
     **
     * Modification of the original drag to allow only vertical drags
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start,
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
     \*/
  e.dragVertical = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
    if (!arguments.length) {
      var origTransform;
      return this.drag(function (dx, dy) {
        this.attr({
          "transform": origTransform + (origTransform ? "T" : "t") + [0, dy],
        });
      }, function () {
        origTransform = this.transform().local;
      });
    }
    function start(e, x, y) {
      (e.originalEvent || e).preventDefault();
      this._drag.x = x;
      this._drag.y = y;
      this._drag.id = e.identifier;
      !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
      drag.push({"el": this, "move_scope": move_scope, "start_scope": start_scope, "end_scope": end_scope});
      onstart && eve.on("snap.drag.start." + this.id, onstart);
      onmove && eve.on("snap.drag.move." + this.id, onmove);
      onend && eve.on("snap.drag.end." + this.id, onend);
      eve("snap.drag.start." + this.id, start_scope || move_scope || this, x, y, e);
    }
    this._drag = {};
    draggable.push({"el": this, "start": start});
    this.mousedown(start);
    return this;
  };
});
/**
 * Protael object
 * @class
 */
var Protael = (function () {
  "use strict";
  /**
     * Current version
     * @type {string}
     */
  Protael.version = "1.1.0";
  Protael.link = "http://proteins.burnham.org:8080/Protael/";
  Protael.linkText = "ProtaelJS";
  var iniWidth, //initial requested width
    uiOptions = {
      "mainSeqHeight": 55,
      "featureHeight": 15, // height of the feature track
      "graphHeight": 50,
      "graphSpacing": 30,
      "space": 20,
    },
    /**
         * Object to keep coloring schemas
         * @memberOf Protael
         */
    ColoringSchemes = (function () {
      // see http://www.bioinformatics.nl/~berndb/aacolour.html
      var o = "orange",
        r = "red",
        b = "blue",
        g = "green",
        m = "magenta",
        e = "grey",
        schema = {
          "clustal": {
            "G": o,
            "P": o,
            "S": o,
            "T": o,
            "H": r,
            "K": r,
            "R": r,
            "F": b,
            "W": b,
            "Y": b,
            "I": g,
            "L": g,
            "M": g,
            "V": g,
          },
          "lesk": {
            // Small nonpolar
            "G": o,
            "A": o,
            "S": o,
            "T": o,
            // Hydrophobic
            "C": g,
            "V": g,
            "I": g,
            "L": g,
            "P": g,
            "F": g,
            "Y": g,
            "M": g,
            "W": g,
            // Polar
            "N": m,
            "Q": m,
            "H": m,
            // Negatively charged
            "D": r,
            "E": r,
            // Positively charged
            "K": b,
            "R": b,
          },
          "maeditor": {
            "A": "lightgreen",
            "G": "lightgreen",
            "C": g,
            "D": "DarkGreen",
            "E": "DarkGreen ",
            "N": "DarkGreen ",
            "Q": "DarkGreen ",
            "I": b,
            "L": b,
            "M": b,
            "V": b,
            "F": "#C8A2C8",
            "W": "#C8A2C8",
            "Y": "#C8A2C8", // lilac
            "H": "DarkBlue ",
            "K": o,
            "R": o,
            "P": "pink",
            "S": r,
            "T": r,
          },
          "cinema": {
            // Polar positive
            "H": b,
            "K": b,
            "R": b,
            // Polar negative
            "D": r,
            "E": r,
            // Polar neutral
            "S": g,
            "T": g,
            "N": g,
            "Q": g,
            // Non - polar aliphatic.
            // White is the default color, so don't need this
            //                'A': 'white',
            //                'V': 'white',
            //                'L': 'white',
            //                'I': 'white',
            //                'M': 'white',
            // Non - polar aromatic
            "F": m,
            "W": m,
            "Y": m,
            "P": "brown",
            "G": "brown",
            "C": "yellow",
            // Special characters
            "B": e,
            "Z": e,
            "X": e,
          },
          "ali": {
            "A": e,
            "R": e,
            "N": e,
            "D": e,
            "C": e,
            "E": e,
            "Q": e,
            "G": e,
            "H": e,
            "I": e,
            "L": e,
            "K": e,
            "M": e,
            "F": e,
            "P": e,
            "S": e,
            "T": e,
            "W": e,
            "Y": e,
            "V": e,
          },
        };
      /**
             * Gets Coloring by name, or Clustal CS
             * @param {type} schemaName
             * @returns {schema.clustal|_L32.schema.clustal|schema|_L32.schema}
             */
      function getCSchema(schemaName) {
        schemaName = schemaName.toLowerCase();
        return schema[schemaName] || schema.clustal;
      }
      

      function addCSchema(schemaName, schemas) {
        schema[schemaName] = schemas;
      }
      

      return {"getCSchema": getCSchema, "addCSchema": addCSchema};
    }());
    /**
     * Create toolbar.
     * @private
     * @param {Protael} r - Protael object to hook up events
     * @param {Element} toolbar - toolbar div
     * @param {Boolean} showControls - whether or not toolbar should be visible
     */
  function createToolbarBtns(r, toolbar, showControls) {
    var container = r.container;
    toolbar.a = toolbar.append;
    toolbar.a("Zoom:");
    toolbar.a($(
      "<div class=\"protael_zoomslider\"></div>")
      .slider({
        "value": r.currentScale(),
        "min": .5,
        "max": 15,
        "step": .02,
        "slide": function (event, ui) {
          r.setZoom(ui.value);
        },
      }));
    toolbar.a($("<button id=\"pl-zfit-btn\">Zoom to fit</button>").button({
      "text": false,
      "icons": {
        "primary": "ui-icon ui-icon-arrow-4-diag",
      },
    }).click(function () {
      r.zoomToFit();
    }));
    toolbar.a($("<button id=\"pl-zselection-btn\">Zoom to selection</button>").button({
      "text": false,
      "icons": {
        "primary": "ui-icon ui-icon-arrowthick-2-e-w",
      },
    }).click(function () {
      r.zoomToSelection();
    }));
    toolbar.a("&nbsp;&VerticalLine;&nbsp;Selection: <input type=\"text\" class=\"protael_selection_inp\" readonly/>");
    toolbar.a($("<button id=\"export\">Export</button>").button({
      "text": false,
      "icons": {
        "primary": "ui-icon-disk",
      },
    }).click(function () {
      $("#" + container + "_xarea").text(r.getConstruct());
      $("#" + container + "_cbFullselection").attr("checked", false);
      $("#" + container + "_xdialog").dialog("open");
    }));
    $("#" + container + "_xdialog").dialog({
      "modal": true,
      "height": 300,
      "width": 350,
      "autoOpen": false,
      "buttons": {
        "Ok": function () {
          $(this).dialog("close");
        },
      },
    });
    $("#" + container + "_cbFullselection").change(function () {
      if ($(this).is(":checked")) {
        $("#" + container + "_xarea").text(r.getConstruct(true));
      } else {
        $("#" + container + "_xarea").text(r.getConstruct(false));
      }
    });
    toolbar.a($("<button id=\"pl-reset-selection-btn\">Reset selection</button>").button({
      "text": false,
      "icons": {
        "primary": "ui-icon-refresh",
      },
    }).click(function () {
      r.clearSelection();
    }));
    toolbar.a("&nbsp;&VerticalLine;&nbsp;Coloring:");
    toolbar.a($(
      "<select id=\"pl-schema-select\"><option>Original</option><option>Clustal</option><option>Lesk</option><option>Cinema</option><option>MAEditor</option><option>ALI</option><option>None</option></select>")
      .change(function () {
        r.setColoringScheme($(this).val());
      }));
    if (!showControls)
      toolbar.hide();
    //        toolbar.a('&nbsp;&VerticalLine;&nbsp;');
    //        toolbar.a($(
    //            '<input type="checkbox" id="chkTooltip" checked="true"><label for="chkTooltip">Cursor tooltips</label>')
    //            .change(
    //                function () {
    //                    r.setShowCursorTooltips($("#chkTooltip").is(':checked'));
    //                }));
    toolbar.a("&nbsp;&VerticalLine;&nbsp;");
    toolbar.a($("<button id=\"pl-export-svg-btn\">Export SVG</button>").button({
      "text": false,
      "icons": {
        "primary": "ui-icon ui-icon-image",
      },
    }).click(function () {
      r.saveAsSVG();
    }));
    //         toolbar.append('ScreenX: <input type="text" id="sx_inp" readonly/>');
    //         toolbar.append('RealX: <input type="text" id="rx_inp" readonly/>');
  }

  /**
     * @constructor
     * @memberOf Protael
     * @param {Protein} protein Protein JSON
     * @param {string} container ID of the container to which Protael is appended
     * @param {boolean} controls Whether or not enabelt controls/toolbar
     */
  function Protael(protein, container, controls) {
    if (!(this instanceof  Protael)) {
      return new Protael(protein, container, controls);
    }
    //create dom structure; this is ugly, i know
    //TODO: clean up this mess
    var browser = navigator.appVersion,
      self = this,
      s = "<div class=\"ui-widget-content protael_resizable\"></div>",
      newDiv = $(s),
      toolbar = $("<div class=\"ui-widget-header ui-corner-all protael_toolbar\"></div>"),
      svgString = "<div width=\"100%\" height=\"100%\" class=\"protael_svg\">" +
            "<svg id=\"" + container + "_svgcanvas\" width=\"100%\" height=\"100%\" preserveAspectRatio=\"xMinYMin meet\">"
            + "<desc>Protael " + Protael.version + "</desc>"
            + "</svg></div>",
      svg = $(svgString);
    $("#" + container).append(newDiv);
    this.container = container;
    newDiv.append(toolbar);
    newDiv.append(svg);
    this.protein = protein;
    iniWidth = svg.width();
    this.controlsEnabled = controls;

    if (controls) {
      newDiv
        .append("<div id=\"" + container + "_xdialog\" title=\"Export selection\"><form><fieldset><input type=\"checkbox\" id=\"" + container + "_cbFullselection\">Include data from all graphs and sequences<br/><br/><textarea id=\"" + container + "_xarea\" cols=\"40\" rows=\"10\"></textarea></fieldset></form></div>");
      createToolbarBtns(this, toolbar, controls);
    }
    newDiv
      .append("<div id=\"propsdialog\" title=\"Properties\"></div>");
    // Dialog to display xternal links
    $("#propsdialog").dialog({
      "modal": true,
      "autoOpen": false,
      "width": "auto",
      "buttons": {
        "Ok": function () {
          $(this).dialog("close");
        },
      },
    });
    this.selectedx = [-1, -1]; // selection minX-maxX

    this.svgDiv = $("#" + container + " .protael_svg");
    this.selectInput = $("#" + container + " .protael_selection_inp");
    // need this flag to implement "strechable" sequence
    this.isChrome = (browser.indexOf("Chrome") >= 0 || browser
      .indexOf("Opera") >= 0);
    // need this for safari mask+gradient workaround
    this.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window["safari"] || safari.pushNotification);
    //        console.log("Can use stretchable seq: " + this.isChrome);
    this.currScale = 1;
    this.currShift = 0;
    this.showCursorTooltips = true;
    this.paper = new Paper(container, svg.width(), svg.height(), this);
    this.W = this.protein.sequence.length;
    this.paper.setSize(this.W, 10);
    //newDiv.resizable({
    //    stop: function (ev, ui) {
    //        self.zoomToFit();
    //    }
    //});
  }
  

  /**
     * Paper object for drawing.
     * Do not use directly, this is called from Protael constructor
     *
     * @class Paper
     * @memberOf Protael
     * @private
     * @constructor
     * @param {string} container Parent container ID
     * @param {number} w paper width
     * @param {number} h paper height
     * @param {Protael} parent Protael object reference
     * @returns {Paper}
     */
  function Paper(container, w, h, parent) {
    this.protael = parent;
    this.paper = Snap("#" + container + "_svgcanvas");
    this.paper.attr({
      "viewBox": "0 0 " + w + " " + h,
    });
    var p = this.paper; //shortcut

    this.pLink = p.text(0, 0, "Powered by Protael").attr({"id": "prref"});
    this.pLink.click(function () {
      window.open("http://proteins.burnham.org:8080/Protael/");
    });
    this.viewSet = Snap.set(); // contains all objects for scaling
    this.textSet = Snap.set(); // contains all text elements of the canvas
    //        this.outsideLabelsSet = Snap.set(); //contains all labels which has to be outside
    //        this.outsideLabelsSet.width = 0;
    this.textSet.push(this.pLink);
    this.overlayFtLabels = Snap.set(); // contains labels for overlay features (for
    // switching views on zoomin/out)
    this.createDefs();

    //Groups to hold different parts of the plot//
    this.gAxes = p.g().attr({"id": "axes"}); // axes and lanels
    this.gSequences = p.g().attr({"id": "seqs"}); // sequence chars and backgrounds
    this.gFTracks = p.g().attr({"id": "ftracks"}); // feature tracks
    this.gQTracks = p.g().attr({"id": "qtracks"}); // quantitative tracks
    this.seqChars = p.g().attr({
      "id": "seqChars",
      "font-family": "monospace",
      "font-size": "12px",
      "text-anchor": "start",
      "letter-spacing": "0px",
    });
    this.seqLines = p.g().attr({"id": "seqLines"});
    this.seqLineCovers = p.g().attr({
      "id": "seqLineCovers",
      "opacity": 0,
    });
    this.seqBGSet = p.g().attr({
      "id": "seqBGSet",
      "opacity": 0.7,
    });
    this.seqLabelsSet = p.g().attr({
      "font-size": "9px",
      "text-anchor": "start",
      "id": "seqLabels",
    });
    return this;
  }

  /**
     * @memberOf Paper
     * @param {type} paperproto
     * @returns {undefined}
     */
  (function (paperproto) {
    /**
         * Sets new paper size.
         * @memberOf Paper
         * @param {number} w new width
         * @param {number} h new heigt
         * @returns {undefined}
         */
    paperproto.setSize = function (w, h) {
      var p = this.paper, vb = p.attr("viewBox"),
        hh = "".concat(h).concat("px");
      vb.height = h;
      p.attr({
        "height": hh,
        "width": w,
        "viewBox": vb,
      });
      this.pLink.attr({
        "x": w - 1, // - vbl.width-5,
        "y": h, //- vbl.height-5
      });
      Snap.selectAll(".pl-grid-major").attr({"y2": h});
      Snap.selectAll(".pl-grid-minor").attr({"y2": h});
      Snap.selectAll("#selector").attr({"height": h});
      Snap.selectAll("#blanket").attr({"height": h});
      Snap.selectAll("#pointer").attr({"height": h});
      return this;
    };

    paperproto.updateSize = function () {
      var bb = this.paper.getBBox();
      this.setSize(bb.w, bb.h + 10);
    };

    /**
         * Gets current paper width.
         * @returns {number}
         */
    paperproto.getWidth = function () {
      return this.paper.attr("width");
    };
    /**
         * Sets zoom for the view.
         * @param {number} zoom - requested zoom
         * @returns {undefined}
         */
    paperproto.setZoom = function (zoom) {
      var p = this.protael,
        ds = zoom / p.currScale,
        w = this.getWidth();
      if (w.indexOf("px") > 0) {
        w = w.replace(/[^\d.-]/g, "");
      }

      var newWidth = Math.round(w * ds);
      this.setWidth(newWidth);
      this.viewSet.forEach(function (t) {
        var x = t.attr("x"), w = t.attr("width");
        if (x) {
          t.attr({"x": x * ds});
        } else {
          // we have lines and paths here
          if (t.type === "line") {
            var x1 = t.attr("x1"), x2 = t.attr("x2");
            t.attr({
              "x1": x1 * ds,
              "x2": x2 * ds,
            });
          } else if (t.type === "path" || t.type === "polygon" || t.type === "polyline") {
            t.transform("s" + zoom + " 1 0 0");
          } else {
          }
        }
        if (w && !isNaN(w))
          t.attr({
            "width": w * ds,
          });
      });
      this.textSet.forEach(function (t) {
        var x = t.attr("x");
        if (x) {
          // just text
          t.attr({
            "x": x * ds,
          });
        } else {
          // underline of bridge
          // if (t.type === "line") {
          // var x1 = t.attr("x1"), x2 = t.attr("x2");
          // var l = x2 - x1;
          // var xx = x1 * ds;
          // t.attr({
          // x1 :xx,
          // x2 : xx + l
          // });
          // }
        }
      });
      // ///////////////////
      // works in Chrome only
      if (this.isChrome) {
        var sseq = this.strechSeq;
        sseq.attr({
          "letter-spacing": "0px",
        }).hide();
        var unstrW = sseq.getBBox().width,
          deltaW = newWidth - unstrW,
          sl = sseq.attr("numspaces"),
          newspa = deltaW / sl + "px",
          x = sseq.attr("x");
        sseq.attr({
          "x": x * ds,
          "letter-spacing": newspa,
        });
        this.seqChars.attr({
          "letter-spacing": newspa,
        });
      }
      // //////////////////

      p.currScale = zoom;
      // p.currScale > 1 ? this.seqBGSet.show() : this.seqBGSet.hide();
      p.currScale > 7 ? this.seqChars.show() : this.seqChars.hide();
      p.currScale > 7 ? this.overlayFtLabels.forEach(function (t) {
        t.hide();
      }) : this.overlayFtLabels.forEach(function (t) {
        t.show();
      });
      return this;
    };
    /**
         * Draws gridlines.
         * @param {number} w
         * @param {number} dx
         * @returns {_L399.paperproto.gAxes}
         */
    paperproto.axis = function (w, dx) {
      var i, maxI = w / dx + 1,
        l, t,
        H = this.paper.getBBox().h,
        p = this.paper,
        axesLabels = p.g().attr({
          "id": "gridLbls",
          "class": "pl-grid-label",
        });
      for (i = 0; i <= maxI; i++) {
        l = p.line(Math.round(i * dx), 0, Math.round(i * dx), H);
        if (i % 5 === 0) {
          l.attr({"class": "pl-grid-major"});
          t = p.text(i * dx, 8, i * dx);
          this.textSet.push(t);
          axesLabels.add(t);
        } else {
          l.attr({"class": "pl-grid-minor"});
        }
        this.gAxes.add(l);
        this.viewSet.push(l);
      }

      this.gAxes.add(axesLabels);
      return this.gAxes;
    };

    //        paperproto.addOutsideLabel = function (labelEl) {
    //            this.outsideLabelsSet.push(labelEl);
    //            var bb = labelEl.getBBox();
    //            this.outsideLabelsSet.width = this.outsideLabelsSet.width > bb.width ?
    //                this.outsideLabelsSet.width : bb.width;
    //        };

    paperproto.createDefs = function () {
      var p = this.paper,
        dx = 5, dy = 8, y = 38,
        thegap = p.g().attr({
          "id": "gap",
          "stroke-width": 2,
        }),
        s = "m 9.943742,1.54515 0,7.665216 C 9,15 8.977801,15 6,18 5.092011,19.329493 0.900884,20.578894 0,22 -0.903141,20.578894 -4.252632,19.379901 -5.160607,18.050408 -7.745849,14.487355 -9.7582132,11.922758 -9.6863207,9.212778 l 0,-7.667628 -5.7594933,0 0,7.665216 c 0.07412,5.544348 3.171965,8.901205 5.6876008,12.525256 2.6545072,3.598566 6.1354302,5.259308 6.0060532,7.136425 L -3.75216,38 4,38 4,28.866878 c -0.129374,-1.874375 3.351556,-3.535283 6.006045,-7.133892 2.518073,-3.62402 5.613376,-6.978272 5.687696,-12.52262 l 0,-7.665216 z";
      p.path(s).transform("scale(0.3)").attr({"id": "glycan"}).toDefs();
      s = "m 9.943742,1.54515 0,7.665216 c 0.01858,0.678098 -1.8182777,4.537747 -2.31158,4.024493 L -1.548312,3.388971 -5,6.5 6.022199,18 C 5.11421,19.329493 2.03074,20.719454 1.129856,22.14056 0.226715,20.719454 -4.252632,19.379901 -5.160607,18.050408 -7.745849,14.487355 -9.7582132,11.922758 -9.6863207,9.212778 l 0,-7.667628 -5.7594933,0 0,7.665216 c 0.07412,5.544348 3.171965,8.901205 5.6876008,12.525256 2.6545072,3.598566 6.1354302,5.259308 6.0060532,7.136425 L -3.75216,38 4,38 4,28.866878 c -0.129374,-1.874375 3.351556,-3.535283 6.006045,-7.133892 2.518073,-3.62402 5.613376,-6.978272 5.687696,-12.52262 l 0,-7.665216 z";
      p.path(s).transform("scale(0.3)").attr({
        "id": "oliglycan",
      }).toDefs();
      s = "M 9.943742,1.54515 5.757162,5.359859 4,1.625 l -7,0 -2.311321,3.712778 -4.3749997,-3.792628 -5.7594933,0 5.6876008,8.190472 c 2.6545072,3.598566 6.1354302,1.259308 6.0060532,3.136425 L -3.75216,38 4,38 4,12.866878 C 4,11 7.351556,13.331595 10.006045,9.732986 L 15.693741,1.54515 z";
      p.path(s).transform("scale(0.3) ").attr({
        "id": "unknownglycan",
      }).toDefs();
      p.line(0, 0, 0, 12).attr({
        "id": "stick",
        "stroke-width": 2,
      }).toDefs();
      p.g(p.line(0, 0, 0, 12), p.circle(0, 2, 2.5)).attr({
        "id": "pin",
        "stroke-width": 2,
      }).toDefs();
      thegap.add(p.line(0, dy, 0, y - dy));
      thegap.add(p.line(-dx, 0, 0, dy));
      thegap.add(p.line(dx, 0, 0, dy));
      thegap.add(p.line(-dx, y, 0, y - dy));
      thegap.add(p.line(dx, y, 0, y - dy));
      thegap.toDefs();
    };
    /**
         * Adds marker definition.
         * @param {type} defpath path describing the marker
         * @param {type} label name of the marker
         * @param {type} transform transformation string
         * @returns {undefined}
         */
    paperproto.addDef = function (defpath, label, transform) {
      if (this.paper.el("use").attr({"xlink:href": "#" + label}))
      {
        console.log("Marker with the name '" + label + "' already exists!");
        return;
      }
      var d = this.paper.path(defpath).attr({
        "id": label,
      });
      if (transform) {
        d.transform(transform);
      }

      d.toDefs();
    };
    /**
         *
         * @param {string} defid Marker ID
         * @param {number} x X-coordinate
         * @param {number} y Y -coordinate
         * @param {object} attrs
         * @returns {@this;@pro;paper@call;g}
         */
    paperproto.createUse = function (defid, x, y, attrs) {
      var el = this.paper.el("use").attr({
          "x": x - 0.5,
          "y": y,
          "xlink:href": "#" + defid,
        }),
        r = this.paper.rect(x - .75, y, 1.5, 15).attr({"opacity": 0}),
        g = this.paper.g(r, el);
      g.attr(attrs);
      this.viewSet.push(r);
      this.viewSet.push(el);
      return g;
    };
    paperproto.setWidth = function (width) {
      var ww, vb = this.paper.attr("viewBox");
      vb.width = "".concat(width);// + 20).concat('px');
      ww = "".concat(width).concat("px");
      this.paper.attr({
        "width": ww,
        "viewBox": vb,
      });
    };
    paperproto.proteinSeqBG = function (chars, scolors, yy, showSequence, offset, label) {
      offset = offset * 1 - 1 || 0;
      var inst = this.protael,
        self = this,
        paper = this.paper,
        white = "white";
      setTimeout(
        function () {
          //    var group = paper.select ("#seq_"+label);
          var scale = inst.currentScale() || 1,
            h = showSequence ? 9 : 3,
            color = white,
            prevColor = color,
            // start and end of the rectangle
            start = 1,
            allrects = [], c,
            length = chars.length,
            r,
            y = yy;
          for (c = 0; c < length; c++) {
            color = scolors[c] || white;
            if (prevColor !== color) {
              if (prevColor !== white) {
                r = paper.rect((start + offset) * scale, y,
                  (c - start) * scale, h).attr({
                  "fill": prevColor,
                  "stroke": prevColor,
                });
                // }
                allrects.push(r);
                self.viewSet.push(r);
                // group.add(r);
              }
              start = c;
              prevColor = color;
            }
          }
          // last rect
          if (prevColor !== white) {
            r = paper.rect((start + offset) * scale, y,
              (c - start) * scale, h).attr({
              "fill": prevColor,
              "stroke": prevColor,
            });
            allrects.push(r);
            self.viewSet.push(r);
            //       group.add(r);
          }

          self.seqBGSet.add(allrects);
        }, 10);
    };
    paperproto.proteinSequence = function (chars, y, showSequence, alignment) {
      alignment = alignment || {};
      y = y || 10;
      var p = this.paper,
        self = this,
        label = alignment.label || alignment.id || alignment.description,
        sequenceGroup = p.g().attr({"id": "SG_" + label, "title": label || ""}),
        startX = alignment.start - 1 || 0,
        inst = this.protael,
        h = showSequence ? 15 : 3,
        line = p.line(0, (y + h / 2), this.protael.W, (y + h / 2))
          .attr({"class": "pl-seqline"}),
        rect = p.rect(0, y, this.protael.W, 10).attr({"id": "seq_" + label, "title": label || "", "opacity": 0}),
        l = chars.length,
        unstrW;
      sequenceGroup.add(rect, line);
      alignment.data = alignment.data || {};
      if (alignment.clazz) {
        rect.attr({"class": alignment.clazz});
      }

      if (alignment.description) {
        alignment.data["Description"] = alignment.description;
      }

      propsToDataStars(alignment, rect);
      this.seqLineCovers.add(rect);
      this.seqLines.add(line);
      this.viewSet.push(line, rect);
      if (label) {
        var mxL = 25, lblText = this.paper.text(1, y, label.substr(0, mxL));
        self.seqLabelsSet.add(lblText);
        //                this.addOutsideLabel(lblText);
      }
      if (showSequence) {
        // TODO: hmmm.... i have a bad feeling about this. will it use only main seq?
        if (this.isChrome) {
          this.strechSeq = this.paper.text(startX * inst.currentScale(), y + 8,
            chars.join("")).hide();
          unstrW = this.strechSeq.getBBox().width;
          this.strechSeq.attr({
            "uwidth": unstrW,
            "numspaces": chars.length,
          });
          this.textSet.push(this.strechSeq);
          this.seqChars.add(this.strechSeq);
        } else {
          setTimeout(function () {
            if (showSequence) {
              var allchars = [], c, x, chr;
              for (c = 0; c < l; c++) {
                if (chars[c] !== ".") {
                  x = (startX + c) * inst.currentScale();
                  chr = p.text(x, y + 8, chars[c]);
                  allchars.push(chr);
                  self.textSet.push(chr);
                }
              }
              self.seqChars.add(allchars);
            }
          }, 10);
        }
      }
    };
    paperproto.clearColoring = function () {
      //TODO: use forEach()
      for (var c in this.seqBGSet)
        this.viewSet.exclude(this.seqBGSet[c]);
      this.seqBGSet.clear();
    };
    paperproto.setColoringScheme = function (CS) {
      this.clearColoring();
      if (CS.toLowerCase() === "none") {
        return;
      }

      var topY = this.aliTop,
        protein = this.protael.protein,
        show = protein.alidisplay ? true : false, // show MAS letters?
        scolors = [],
        data,
        chars = protein.sequence.toUpperCase().split(""),
        gutter = 35,
        i, j, maxJ, c, maxC,
        ali;
      if (CS.toLowerCase() === "original") {
        // restore original coloring
        if (protein.seqcolors) {
          data = Utils.splitData(protein.seqcolors.data.toUpperCase());
          for (c = chars.length; c--; ) {
            scolors[c] = protein.seqcolors.colors[data[c]];
          }
        } else {
          this.setColoringScheme("none");
        }

        this.proteinSeqBG(chars, scolors, gutter, true);
        if (protein.alignments) {
          for (j = 0, maxJ = protein.alignments.length; j < maxJ; j++) {
            ali = protein.alignments[j];
            scolors = [];
            chars = ali.sequence.split("");
            if (ali.color) {
              // USE SINGLE INSTANCE COLOR
              for (c = chars.length; c--; ) {
                scolors[c] = ali.color;
              }
            } else if (ali.seqcolors) {
              data = Utils.splitData(ali.seqcolors.data.toUpperCase());
              if (ali.seqcolors.colors && Array.isArray(ali.seqcolors.colors)) {
                // USE instance colors

                for (c = chars.length; c--; ) {
                  scolors[c] = ali.seqcolors.colors[data[c]];
                }
              } else if (protein.seqcolors.colors) {
                // use protein

                for (c = chars.length; c--; ) {
                  scolors[c] = protein.seqcolors.colors[data[c]];
                }
              }
            } else {
              // use main colors
              scolors = Utils.getColors(chars, ColoringSchemes.getCSchema(ali.CS || "ALI"));
            }
            this.proteinSeqBG(chars, scolors, topY, show,
              ali.start || 0, ali.label);
            topY += 10;
            if (protein.alidisplay)
              topY += 5;
          }
        }
      } else {
        var schema = ColoringSchemes.getCSchema(CS);
        scolors = Utils.getColors(chars, schema);
        this.proteinSeqBG(chars, scolors, gutter, true);
        if (protein.alignments)
          for (var j in protein.alignments) {
            chars = protein.alignments[j].sequence.split(""),
            scolors = Utils.getColors(chars, schema);
            this.proteinSeqBG(chars, scolors, topY, show,
              protein.alignments[j].start || 0);
            topY += 10;
            if (protein.alidisplay)
              topY += 5;
          }
      }
    };
    paperproto.addColoringScheme = function (name, schema) {
      ColoringSchemes.addSChema(name, schema);
    };
    paperproto.featureTrack = function (ftrack, topY, height, allowOverlaps, showLabels, isOverlay) {
      //   console.log("Drawing ftrack: " + ftrack.label);
      var paper = this.paper,
        clazz = "pl-ftrack " + (ftrack.clazz || ""),
        g = paper.g().attr({
          "id": ftrack.label,
          "class": clazz,
          "font-size": (height - 8) + "px",
        }),
        display = ftrack.display || "block",
        color = ftrack.color || "",
        seenDeltas = [],
        lastLevel = 0,
        ft, delta,
        f,
        maxF = ftrack.features.length;
      this.gFTracks.add(g);
      seenDeltas.push(0);
      if (allowOverlaps) {
        for (f = 0; f < maxF; f++) {
          ft = ftrack.features[f];
          if (ft) {
            var featureGroup = this.feature(ft, ft.color || color, display,
              0, height, g, showLabels, allowOverlaps, isOverlay);
            /// TODO: what is this? no idea why I wrote this
            if (ft.click) {
              featureGroup.click(ft.click(ft.dbxrefs));
            }

            propsToDataStars(ft, featureGroup);
          }
        }
      } else {
        ftrack.features.sort(function (a, b) {
          return a.start - b.start;
        });
        var arrcopy = JSON.parse(JSON.stringify(ftrack.features)),
          lastX = 0;
        while (arrcopy.length > 0) {
          ft = arrcopy.shift();
          if (ft) {
            delta = 0;
            ft.draw_level = ft.draw_level || 0;
            delta = ft.draw_level * height;
            if ($.inArray(delta, seenDeltas) === -1)
              seenDeltas.push(delta);
            if (ft.draw_level !== lastLevel)
              lastX = 0;
            if (ft.start >= lastX) {
              var featureGroup = this.feature(ft, ft.color || color,
                display, 0 + delta, height, g, true, allowOverlaps, isOverlay);
              if (ft.click) {
                featureGroup.click(ft.click);
              }
              propsToDataStars(ft, featureGroup);
              lastX = ft.end;
              lastLevel = ft.draw_level;
            } else {
              ft.draw_level++;
              arrcopy.push(ft);
            }
          }
        }
      }

      if (ftrack.showLine) {
        var d = (display === "block") ? 0 : -height / 2 + 2,
          yy = height / 2 - d;
        for (var delta in  seenDeltas) {
          var dd = seenDeltas[delta],
            line = paper.line(0, yy + dd, this.protael.W, yy + dd).attr({
              "stroke": "#BBB",
              "fill": "#BBB",
              "stroke-width": "1px",
              "title": ftrack.label || "",
            }).toBack();
          g.prepend(line);
          this.viewSet.push(line);
        }
      }
      if (!isOverlay) {
        var label = paper.text(.1, -4, ftrack.label).attr({"class": "pl-ftrack-label"});
        g.append(label);
        //                this.addOutsideLabel(label);
      }
      g.transform("translate(0, " + topY + ")");
      g.dragVertical();
      return lastLevel;
    };
    paperproto.feature = function (feature, color, display, topY, height, g, showLabel, allowOverlaps, isOverlay) {
      var s = feature.start - 1,
        e = feature.end,
        shapeGr,
        shape,
        label,
        clazz = "pl-feature",
        paper = this.paper;
      //      console.log("\tDrawing feature: " + feature.label);
      if (display === "block") {
        shape = paper.rect(s, topY, e - s, height);
      } else if (display === "line") {
        shape = paper.rect(s, topY + height / 2 + 4, e - s, 3);
      }

      if (color) {
        shape.attr({"fill": color, "stroke": color});
      }
      if (allowOverlaps) {
        shape.attr({"opacity": .6});
      }
      if (feature.clazz) {
        clazz += " " + feature.clazz;
        shape.attr({"class": feature.clazz});
      }
      shapeGr = paper.g().attr({
        "id": feature.id || "",
        "title": feature.label || "",
        "fill": color,
        "class": clazz,
      });
      shapeGr.add(shape);
      if (showLabel) {
        label = paper.text((0.5 * s + 0.5 * e), topY + height - 5,
          feature.label);
        label.attr({"stroke": "none", "class": "pl-feature-label"});
        shapeGr.append(label);
        this.textSet.push(label);
        if (isOverlay) {
          this.overlayFtLabels.push(label);
        }
      }
      g.add(shapeGr);
      this.viewSet.push(shape);
      return shapeGr;
    };
    /**
         * Creates formated path string for SVG cubic path element
         * @param {type} x1
         * @param {type} y1
         * @param {type} px1
         * @param {type} py1
         * @param {type} px2
         * @param {type} py2
         * @param {type} x2
         * @param {type} y2
         * @returns {String}
         */
    paperproto.path = function (x1, y1, px1, py1, px2, py2, x2, y2) {
      return "L" + x1 + " " + y1 + " C" + px1 + " " + py1 + " " + px2 + " " + py2 + " " + x2 + " " + y2;
    };
    /* computes control points given knots K, this is the brain of the operation
         * From: http://www.particleincell.com/blog/2012/bezier-splines/
         * */
    function computeControlPoints(K) {
      var i, m,
        p1 = new Array(),
        p2 = new Array(),
        n = K.length - 1,
        /*rhs vector*/
        a = new Array(),
        b = new Array(),
        c = new Array(),
        r = new Array();
      /*left most segment*/
      a[0] = 0;
      b[0] = 2;
      c[0] = 1;
      r[0] = K[0] + 2 * K[1];
      /*internal segments*/
      for (i = 1; i < n - 1; i++) {
        a[i] = 1;
        b[i] = 4;
        c[i] = 1;
        r[i] = 4 * K[i] + 2 * K[i + 1];
      }

      /*right segment*/
      a[n - 1] = 2;
      b[n - 1] = 7;
      c[n - 1] = 0;
      r[n - 1] = 8 * K[n - 1] + K[n];
      /*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
      for (i = 1; i < n; i++) {
        m = a[i] / b[i - 1];
        b[i] = b[i] - m * c[i - 1];
        r[i] = r[i] - m * r[i - 1];
      }

      p1[n - 1] = r[n - 1] / b[n - 1];
      for (i = n - 2; i >= 0; --i) {
        p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];
      }

      /*we have p1, now compute p2*/
      for (i = 0; i < n - 1; i++) {
        p2[i] = 2 * K[i + 1] - p1[i + 1];
      }
      p2[n - 1] = 0.5 * (K[n] + p1[n - 1]);
      return {"p1": p1, "p2": p2};
    }

    function prepareQTValues(data, qtrack) {
      var vv = data;
      var noZeros = qtrack.forceNonZero;
      var min = Math.min.apply(null, vv);

      if (qtrack.transform) {

        if (qtrack.transform === "log") {
          vv.forEach(function (e, i, a) {
            if (noZeros && e === 1) {
              a[i] = .5;
            } else {
              if (min < 0) {  //no log for negative values! shift
                e += min;
              }
              a[i] = e ? Math.log(e) : 0;
            }
          });
        } else if (qtrack.transform === "log2") {
          vv.forEach(function (e, i, a) {
            if (noZeros && e === 1) {
              a[i] = .5;
            } else {
              if (min < 0) {
                e += min;
              }
              a[i] = e ? Math.log(e) : 0;
            }
          });
        } else if (qtrack.transform === "log10") {
          vv.forEach(function (e, i, a) {
            if (noZeros && e === 1) {
              a[i] = .5;
            } else {
              if (min < 0) {
                e += min;
              }
              a[i] = e ? Math.log(e) : 0;
            }
          });
        } else if (qtrack.transform === "exp") {
          vv.forEach(function (e, i, a) {
            if (min < 0) {
              e += min;
            }
            a[i] = Math.exp(e);
          });
        }
      }

      // limit values to user-defined displayMax and Min
      if (qtrack.displayMax) {
        vv.forEach(function (e, i, a) {
          a[i] = Math.min(e, qtrack.displayMax);
        });
      }
      if (qtrack.displayMin) {
        vv.forEach(function (e, i, a) {
          a[i] = Math.max(e, min);
        });
      }

      return vv;
    }

    paperproto.quantTrack = function (qtrack, topY, width, height) {
      //    console.log("Drawing qtrack: " + qtrack.values);
      // data will be used for
      var data = Array.isArray(qtrack.values) ?
          qtrack.values : Utils.splitData(qtrack.values),
        vv = prepareQTValues(data.slice(), qtrack),
        i, j, jj,
        c = qtrack.color || "#F00",
        fill = c,
        // this might seem redundant, since vv was trimmed to fit into boundaries,
        // but is displayMax/Min are outside of values range we still need to scale the chart
        max = qtrack.displayMax ? qtrack.displayMax : Math.max.apply(null, vv),
        min = qtrack.displayMin ? qtrack.displayMin : Math.min.apply(null, vv),
        zero = (max === min) ? 0 : (-min) / (max - min) * 100, // for gradient
        ky = (max === min) ? 0 : height / (max - min), // for coords
        path = "",
        // different chart types
        spline = "spline",
        column = "column",
        area = "area",
        areaspline = "area-spline",
        line = "line",
        type = qtrack.type || areaspline,
        X, Y, W = this.protael.W,
        paper = this.paper,
        chart2,
        parent = this.protael;
      // pad values aray with 0
      for (i = vv.length; i <= width; i++) {
        vv[i] = 0;
      }

      if (Array.isArray(c)) {
        if (c.length === 1) {
          fill = c[0];
        } else if (c.length === 2) {
          if (c[1] !== "") {
            fill = paper.gradient("l(0, 1, 0, 0)" + c[0] + ":10-" + c[1] + ":90");
          }
        } else if (c.length === 3) {
          if (c[1] === "") {
            fill = c[0];
          } else if (c[2] === "") {
            fill = paper.gradient("l(0, 1, 0, 0)" + c[0] + ":10-" + c[1] + ":90");
          } else {
            fill = paper.gradient("l(0, 1, 0, 0)" + c[0] + ":10-" + c[1] + ":" + zero + "-" + c[2] + ":90");
          }
        }
      }

      if (type === area || type === line || type === areaspline || type === spline) {
        path = "M0 " + (height + min * ky);
        if (type === area || type === line) {
          // no smoothing required, just connect the dots
          for (j = 0; j < W; j++) {
            X = j;
            Y = height - (vv[j] - min) * ky;
            if (j !== jj - 1) {
              path = path + "L" + X + ", " + Y;
            }
          }
          path = path + "L" + (W) + " " + (height + min * ky) + " Z";
        } else if (type === areaspline || type === spline) {
          /*grab (x,y) coordinates of the control points*/
          var xx = new Array(),
            yy = new Array(), px, py;
          for (i = 0; i < W; i++) {
            /*use parseInt to convert string to int*/
            xx[i] = i;
            yy[i] = height - (vv[i] - min) * ky;
          }

          /*computes control points p1 and p2 for x and y direction*/
          px = computeControlPoints(xx);
          py = computeControlPoints(yy);
          /*updates path settings, the browser will draw the new spline*/
          for (i = 0; i < W; i++) {
            path +=
                            this.path(xx[i], yy[i], px.p1[i], py.p1[i], px.p2[i], py.p2[i], xx[i + 1], yy[i + 1]);
          }
          path = path + "L" + (W) + " " + (height + min * ky) + " Z";
        }

        chart2 = paper.path(path).attr({
          "stroke": fill,
          "fill": fill,
          "class": "pl-chart-area",
        });
        if (type === line || type === spline) {
          // fill with transparent paint
          chart2.attr({
            "fill-opacity": 0,
            "stroke-width": ".1px"});
        }
      } else if (qtrack.type === column) {
        var y0 = height + min * ky;
        var points = [];
        points.push(0, y0);
        for (j = 0; j < W; j++) {
          X = j;
          Y = height - (vv[j] - min) * ky;
          points.push(X, Y, X + 1, Y);
        }
        points.push(W, y0);
        chart2 = paper.polygon(points).attr({
          "stroke": "none", // important!!!
          "fill": fill,
          "class": "pl-chart-area",
        });

        this.viewSet.push(chart2);
      } else {
        console.log("Unknown chart type :" + type);
      }

      var lTop, lBottom;
      if (qtrack.displayScale) {
        lTop = paper.text(.1, 8, max.toFixed(2)).attr({"class": "pl-chart-scalelbl"});
        lBottom = paper.text(.1, height, min.toFixed(2)).attr({"class": "pl-chart-scalelbl"});
      }

      var bgrect = paper.rect(0, 0, W, height).attr({"opacity": .0}),
        tooltip = paper.text(.1, 0, max).attr({"class": "pl-chart-tooltip"}).hide(),
        label = paper.text(.1, -.1, qtrack.label).attr({"class": "pl-chart-label"}),
        topLine = paper.line(0, 0, W, 0).attr({"class": "pl-chart-top"}),
        cLine = paper.line(0, max * ky, W, max * ky).attr({"class": "pl-chart-center"}),
        bottomLine = paper.line(0, height, W, height).attr({"class": "pl-chart-bottom"}),
        g = paper.g(chart2, topLine, bottomLine, cLine, label, tooltip, bgrect)
          .attr({"id": "qtrack_" + qtrack.label, "class": "pl-chart"}).transform("translate(0, " + topY + ")");

      if (qtrack.displayScale) {
        g.add(lTop, lBottom);
        this.textSet.push(lTop, lBottom);
      }
      propsToDataStars(qtrack, g);
      /**** Try out for draggable elements*/
      g.dragVertical();

      g.attr({"title": qtrack.label});

      g.mousemove(function (e) {
        var x = $("#" + parent.container + " #pointer").first().attr("x"),
          ox = parent.toOriginalX(x),
          bb = tooltip.getBBox(),
          txt = typeof data[ox - 1] !== "undefined" ? data[ox - 1] : "N/A";
        //                if (qtrack.transform) {
        //                    txt += ", " + qtrack.transform + "=";
        //                    txt += typeof data[ox - 1] !== "undefined" ? vv[ox - 1].valueOf().toFixed(2) : "N/A";
        //                }
        if (bb.x2 > bgrect.getBBox().width / 2) {
          tooltip.attr({"text-anchor": "end"});
        } else {
          tooltip.attr({"text-anchor": "start"});
        }
        tooltip.attr({"x": x, "text": qtrack.label.substring(0, 1) + ".: " + txt});
      });
      g.mouseout(function (e) {
        tooltip.hide();
      });
      g.mouseover(function (e) {
        tooltip.show();
      });
      this.gQTracks.add(g);
      this.viewSet.push(bgrect);
      this.viewSet.push(topLine);
      this.viewSet.push(bottomLine);
      this.viewSet.push(cLine);
      this.viewSet.push(chart2);
      this.textSet.push(label);
      this.textSet.push(tooltip);
      //            this.addOutsideLabel(label);

      return g;
    };
    paperproto.proteinMarkers = function (markers, topY) {
      var markerGp = this.paper.g().attr({
          "id": "gMarkers",
          "class": "pl-marker",
        }),
        i,
        m,
        shift,
        type,
        id,
        mark,
        t,
        att = {
          "font-size": "10px",
          "font-family": "Arial",
          "text-anchor": "middle",
        };
      for (i = markers.length; i--; ) {
        m = markers[i];
        if (!m.x || m.x === "") {
          continue;
        }
        shift = (m.position === "bottom") ? 26 : 0;
        type = m.type ? m.type : "glycan";
        //TODO: add IDs
        id = m.label ? "m_" + m.label : "m_" + i;
        mark = this.createUse(type, m.x, topY + shift, {
          "id": id,
          "title": m.label ? m.label : type,
        });
        if (m.label) {
          shift = (m.position === "bottom") ? 45 : 0;
          t = this.paper.text(m.x, topY + shift, m.label).attr(att);
          if (m.color)
            t.attr({
              "fill": m.color,
            });
          this.textSet.push(t);
          markerGp.add(t);
        }
        if (m.color)
          mark.attr({
            "fill": m.color,
            "stroke": m.color,
          });
        propsToDataStars(m, mark);
        markerGp.add(mark);
      }
    };
    paperproto.proteinBridges = function (bridges, topY) {
      var group = this.paper.g().attr({
          "id": "gBridges",
          "class": "pl-bridge",
        }),
        paper = this.paper,
        bridgeH = 12,
        b, gb,
        att = {}, att2 = {"fill": "white", "stroke": "white"},
        s, e, c, ls, le,
        lc1, t, lc2;
      //TODO: micro-opt
      for (var i in bridges) {
        b = bridges[i];
        gb = paper.g().attr({
          "id": "bridge_" + i,
        });
        propsToDataStars(b, gb);
        att = {};
        if (b.color) {
          att = {
            "fill": b.color,
            "stroke": b.color,
          };
        }
        s = b.start - 0.5;
        e = b.end - 0.5;
        c = (e + s) / 2;
        // start mark
        ls = paper.line(s, topY, s, topY + bridgeH).attr(att);
        this.viewSet.push(ls);
        // end mark
        le = paper.line(e, topY, e, topY + bridgeH).attr(att);
        this.viewSet.push(le);
        // connection lines

        lc1 = paper.line(s, topY + bridgeH, e, topY + bridgeH)
          .attr(att);
        this.viewSet.push(lc1);
        // add labels
        if (b.startlabel) {
          t = paper.text(s, topY + 21, b.startlabel);
          if (b.color)
            t.attr({
              "fill": b.color,
            });
          this.textSet.push(t);
          gb.add(t);
        }
        if (b.endlabel) {
          var t = paper.text(e, topY + 21, b.endlabel);
          if (b.color)
            t.attr({
              "fill": b.color,
            });
          this.textSet.push(t);
          gb.add(t);
        }
        gb.add(ls, le, lc1);
        if (b.type) {
          t = paper.text(c, topY + 15, b.type);
          var textw = b.type.length;
          lc2 = paper.line(c - textw / 2 - 1, topY + bridgeH,
            c + textw / 2 + 1, topY + bridgeH).attr(att2);
          if (b.color) {
            t.attr({
              "fill": b.color,
            });
          }
          t.toFront();
          this.textSet.push(t);
          this.viewSet.push(lc2);
          gb.add(lc2, t);
        }

        group.add(gb);
      }
    };
    paperproto.draw = function (protein) {
      var scolors = [],
        chars = protein.sequence.toUpperCase().split(""),
        topY = 35,
        drawingTop = 20,
        paper = this.paper,
        i, counterMax,
        allowOver, delta;
      if (protein.markers) {
        this.proteinMarkers(protein.markers, drawingTop);
      }

      if (protein.bridges) {
        this.proteinBridges(protein.bridges, topY + 15);
      }

      if (protein.overlayfeatures) {
        var showOLbls = protein.overlayfeatures.showLabels || false;
        this.featureTrack(protein.overlayfeatures, topY - 5, 20, true,
          showOLbls, true);
      }
      this.aliTop = topY;

      this.proteinSequence(chars, topY, true);
      this.proteinSeqBG(chars, scolors, topY, true, "main");
      // /////////////////
      // this works in Chrome, but not so much in Safari or Firefox,
      // will have to think about it later
      if (this.protael.isChrome) {
        this.strechSeq = this.paper.text(0, 30, protein.sequence).attr({
          "id": "strechSeq",
          "font-family": "monospace",
          "font-size": "9px",
          "text-anchor": "start",
          "letter-spacing": "0px",
        }).hide();
        this.strechSeq.attr({
          "uwidth": this.strechSeq.getBBox().width,
          "numspaces": chars.length,
        });
      }
      // ///////////////////////////

      topY += 30;
      this.gLabels = this.paper.g().attr({
        "font-size": "14px",
        "text-anchor": "start",
        "id": "cursor",
      }).hide();
      counterMax = protein.ftracks ? protein.ftracks.length : 0;
      for (i = 0; i < counterMax; i++) {
        allowOver = protein.ftracks[i].allowOverlap || false;
        topY = this.paper.getBBox().h + uiOptions.space;
        delta = this.featureTrack(protein.ftracks[i], topY, uiOptions.featureHeight,
          allowOver, true);
      }

      counterMax = protein.qtracks ? protein.qtracks.length : 0;
      for (i = 0; i < counterMax; i++) {
        if (protein.qtracks[i].values && protein.qtracks[i].values.length) {
          topY = this.paper.getBBox().h + uiOptions.graphSpacing;
          this.quantTrack(protein.qtracks[i], topY, this.protael.W, uiOptions.graphHeight);
          protein.qtracks[i].topY = topY;
        } else {
          console.log("No values found for QTRACK [" + i + "]. Skipping.");
        }
      }
      topY = this.paper.getBBox().h + uiOptions.graphSpacing;
      this.aliTop = topY;
      var show = protein.alidisplay ? true : false; // show MAS letters?

      if (protein.alignments) {
        this.protael.setColoringScheme("Original");
        counterMax = protein.alignments.length;
        for (i = 0; i < counterMax; i++) {
          var ali = protein.alignments[i],
            schars = ali.sequence.split("");
          this.proteinSequence(schars, topY, show, ali);
          topY += 10;
          if (show) {
            topY += 5;
          }
        }
      }
      var H = this.paper.getBBox().h + 5;
      this.axis(this.protael.W, 10).toBack();

      this.gSequences.add(this.seqLabelsSet, this.seqBGSet, this.seqChars, this.seqLines);
      this.labelsWidth = this.seqLabelsSet.getBBox().width;
      this.seqChars.hide().transform("T1, 0");
      this.gSequences.toFront();
      this.seqLines.toBack();
      this.gAxes.toBack();

      this.paper.attr({"height": H});
      this.pLink.attr({
        "y": H,
      });
      // rect to show current position
      this.selector = paper.rect(-1, 0, 0, H).attr({
        "fill": "#DDD",
        "stroke": "#666",
        "stroke-width": "2px",
        "opacity": .5,
        "id": "selector",
      }).hide();
      // rect to show selection

      this.pointer = paper.rect(0, 0, 1, H).attr({
        "fill": "green",
        "stroke": "green",
        "stroke-width": "1px",
        "opacity": .7,
        "id": "pointer",
      });
      this.viewSet.push(this.selector);
      var residueBg = paper.rect(0, 46, 22, 20, 4, 4).attr({
          "fill": "#000",
          "stroke": "black",
          "color": "white",
          "stroke-width": "2px",
          "opacity": .7,
        }), residueLabel = paper.text(0, 60, "").attr({
          "fill": "white",
        });
      this.seqLineCovers.toFront();


      var self = this,
        parent = this.protael,
        // and we need a rect for catching mouse event for the whole chart area
        r = paper.rect(0, 0, parent.W, H).toBack().attr({
          "stroke": "#fff",
          "opacity": 0,
          "id": "blanket",
        }),
        elBlanket = $("#" + parent.container + " #blanket");
            
      this.gLabels.add(residueBg, residueLabel);

      var dragStart = function (x, y, e) {
        parent.clearSelection();
        var xx = parent.toOriginalX(parent.mouseToSvgXY(e).x);
        parent.setSelection(xx, xx);
      };
      var dragMove = function (dx, dy, x, y, e) {
        var sx = dx > 0 ? parent.selectedx[0] : parent.selectedx[1],
          ox = parent.toOriginalX(parent.mouseToSvgXY(e).x),
          max = Math.max(sx, ox), min = Math.min(sx, ox);
        parent.setSelection(min, max);
      };
      var dragEnd = function (event) {
      };

      paper.drag(dragMove, dragStart, dragEnd);

      var onMouseMove = function (e) {
        //adding 2 to shift it a bit from the mouse
        self.pointer.attr({
          "x": parent.mouseToSvgXY(e).x + 2,
        });
      };
      self.pointer.mousemove(function (e) {
        onMouseMove(e);
      });
      paper.mousemove(function (e) {
        onMouseMove(e);
        self.protael.userMouseMove(e);
      });

      paper.click(function (e) {
        self.protael.userMouseClick(e);
      });

      this.viewSet.push(r);
    };
    /**
         * Returns content of the paper as SVG string
         * @returns {string} SVG string representing current paper content
         */
    paperproto.toSVGString = function () {
      return this.paper.toString();
    };
    /**
         * Create data-* attributes from object properties
         * @param {type} piece object
         * @param {type} target svg elementy to add attibutes
         */
    function propsToDataStars(piece, target) {
      var res = {};
      if (piece.properties && Object.keys(piece.properties).length) {
        res["data-d"] = JSON.stringify(piece.properties);
      }
      if (piece.dbxrefs && Object.keys(piece.dbxrefs).length) {
        res["data-x"] = JSON.stringify(piece.dbxrefs);
      }
      target.attr(res);
    }
    
  }(Paper.prototype));
  Protael.Paper = Paper;
  Protael.prototype.Utils = {};

  /**
     * Splits string data using ',' or into individual residues
     * @param {type} data
     * @returns {array} values
     */
  Protael.prototype.Utils.splitData = function (data) {
    return (data.indexOf(",") > 0) ? data.split(",") : data.split("");
  };
  /**
     * Returns array of colors, one per residue
     * @param {type} chars
     * @param {type} schema
     * @returns {Array}
     */
  Protael.prototype.Utils.getColors = function (chars, schema) {
    var scolors = [], l = chars.length, c;
    for (c = 0; c < l; c++) {
      scolors[c] = schema[chars[c]] || "white";
    }
    return scolors;
  };
  var Utils = Protael.prototype.Utils; // shortcut

  (function (protaelproto) {
    protaelproto.draw = function () {
      this.paper.draw(this.protein);
      if (!this.CS) {
        this.setColoringScheme("Original");
      }
      // scale to fit
      this.setZoom(iniWidth / this.W);
      this.clearSelection();
      this.initTooltips();
      this.initClicks();
      this.onMouseOver(null);
      this.onClick(null);
      return this;
    };
    protaelproto.setSelection = function (minx, maxx) {
      minx = Math.max(1, minx);
      maxx = Math.min(this.protein.sequence.length, maxx);
      this.selectedx[0] = minx;
      this.selectedx[1] = maxx;
      var wd = this.toScreenX(maxx) - this.toScreenX(minx - 1);
      // display screen coordinates
      this.paper.selector.attr({
        "width": wd,
        "x": this.toScreenX(minx - 1) + this.currShift,
      }).show();
      if (this.controlsEnabled) {
        this.selectInput.val(minx + ":" + maxx);
      }
      return this;
    };
    protaelproto.clearSelection = function (x) {
      this.selectedx = [-1, -1];
      this.paper.selector.attr({
        "x": 0,
        "width": 0,
      }).hide().toBack();
      if (this.controlsEnabled) {
        this.selectInput.val("");
      }
      // get current center
      var scr = this.svgDiv.scrollLeft(),
        // TODO: store as variable?
        wd = $("#" + this.container + " .protael_resizable").width(),
        center = this.toOriginalX(scr + wd / 2);
      if (center > this.W) {
        center = this.W / 2;
      }
      return this;
    };
    protaelproto.translate = function (dx) {
      this.svgDiv.scrollLeft(this.svgDiv.scrollLeft() + dx);
      return this;
    };
    protaelproto.zoomIn = function () {
      this.setZoom(this.currScale + 0.1);
      return this;
    };
    protaelproto.zoomOut = function () {
      this.setZoom(this.currScale - 0.1);
      return this;
    };
    protaelproto.zoomToFit = function () {
      var w = this.svgDiv.width();
      this.setZoom(w / this.W);
      return this;
    };
    protaelproto.zoomToSelection = function () {
      if (this.selectedx[1] === -1)
        return;
      var w = this.selectedx[1] - this.selectedx[0];
      this.setZoom(this.svgDiv.width() / w - 0.2);
      var s = (this.selectedx[0] + w / 2) * this.currScale - this.svgDiv.width() / 2;
      this.svgDiv.scrollLeft(s);
      return this;
    };
    protaelproto.setPaperWidth = function (width) {
      this.paper.setWidth(width);
      return this;
    };
    protaelproto.currentScale = function () {
      return this.currScale;
    };
    /*
         * Returns FASTA-formatted construct. If needFuul = true, will
         * return also corresponding data for qtracks and alignments
         * @param {type} needFull
         * @returns {String} FASTA-formatted construct data
         */
    protaelproto.getConstruct = function (needFull) {
      if (this.selectedx[0] === -1)
        return "No selection";
      var l = this.protein.label || "construct";
      var text = ">" + l + " "
                + this.selectedx[0] + ":" + this.selectedx[1] + "\n"
                + this.protein.sequence.substring(this.selectedx[0] - 1,
                  this.selectedx[1]);
      if (needFull) {
        // add all sequences
        if (this.protein.alignments) {
          var l;
          for (var i = 0; i < this.protein.alignments.length; i++) {
            var a = this.protein.alignments[i],
              //   sh = a.start - 1,
              t = "";
            l = a.label || a.description || a.id || "seq " + (i + 1);

            if (a.start > 0) {
              t = lineOfChars(a.start - 1, ".");
            }
            t = t + a.sequence;
            if (t.length < this.selectedx[1]) {
              t += lineOfChars(this.selectedx[1] - t.length, ".");
            }
            text += "\n>" + l + "\n" +
                            t.substring(this.selectedx[0] - 1,
                              this.selectedx[1]);
          }
        }
        if (this.protein.qtracks) {
          for (var i = 0; i < this.protein.qtracks.length; i++) {
            if (this.protein.qtracks[i].values || this.protein.qtracks[i].values.length > 0) {
              text += "\n>" + this.protein.qtracks[i].label + "\n" +
                                this.protein.qtracks[i].values.slice(this.selectedx[0] - 1,
                                  this.selectedx[1]);
            }
          }
        }
      }
      return text;
    };
    /**
         * Create string filled with the same char
         * @param {type} length
         * @param {type} char
         * @returns {undefined}
         */
    function lineOfChars(length, char) {
      if (length === 0)
        return "";
      var l2 = length / 2;
      var result = char;

      while (result.length <= l2) {
        result += result;
      }
      return result + result.substring(0, length - result.length);
    }
    protaelproto.toOriginalX = function (x) {
      var y = Math.round((x + this.currShift) / this.currScale + .5);
      // console.log("toOrig (" + x + ") = Math.round((" + x + " + " + this.currShift + ") / " + this.currScale + ")=" + y);
      return y;
    };
    protaelproto.toScreenX = function (x) {
      return Math.round(x * this.currScale - this.currShift);
    };

    protaelproto.setZoom = function (zoom) {
      zoom = Math.min(zoom, 15);
      zoom = Math.max(zoom, 0.5);
      this.paper.setZoom(zoom);
      $("#" + this.container + " .protael_zoomslider").slider("value", this.currScale);
      return this;
    };

    protaelproto.onMouseOver = function (callback) {
      if (callback && typeof (callback) === "function") {
        this.userMouseMove = callback;
      } else {
        this.userMouseMove = function () {};
      }
    };

    protaelproto.onClick = function (callback) {
      if (callback && typeof (callback) === "function") {
        this.userMouseClick = callback;
      } else {
        this.userMouseClick = function () {};
      }
    };

    /**
         *
         * @param {type} event - mouse event
         * @return {unresolved}  Point (x, y) in svg space
         */
    protaelproto.mouseToSvgXY = function (event) {
      var t = event.target,
        svg = document.getElementById(this.container + "_svgcanvas"),
        pt = svg.createSVGPoint();

      pt.x = event.clientX;
      pt.y = event.clientY;

      return pt.matrixTransform(t.getScreenCTM().inverse());
    };

    protaelproto.addQTrack = function (track) {
      var oldZoom = this.currentScale();
      this.setZoom(1);

      if (!this.protein.qtracks)
        this.protein.qtracks = [];

      this.protein.qtracks.push(track);
      var bb = this.paper.paper.getBBox();
      var topY = bb.h + uiOptions.graphSpacing;
      var i = this.protein.qtracks.length - 1;
      this.protein.qtracks[i].topY = topY;
      this.paper.quantTrack(this.protein.qtracks[i], topY, this.W, uiOptions.graphHeight);

      this.paper.updateSize();
      this.setZoom(oldZoom);
    };

    protaelproto.addFTrack = function (track) {
      var oldZoom = this.currentScale();
      this.setZoom(1);

      if (!this.protein.ftracks)
        this.protein.ftracks = [];

      this.protein.ftracks.push(track);
      var bb = this.paper.paper.getBBox();

      var topY = bb.h + uiOptions.space;
      var i = this.protein.ftracks.length - 1;
      this.protein.ftracks[i].topY = topY;
      this.paper.featureTrack(this.protein.ftracks[i], topY, uiOptions.featureHeight, this.protein.ftracks[i].allowOverlap || false, true);

      this.paper.updateSize();
      this.setZoom(oldZoom);
    };

    /**
         * Change current coloring schema
         * @param {type} CS
         * @returns {protael_L1722.protaelproto}
         */
    protaelproto.setColoringScheme = function (CS) {
      this.paper.setColoringScheme(CS);
      this.CS = CS;
      return this;
    };
    /**
         * Wrapper ro Snap.slectAll to make it look more jquery-like
         * @param {type} query
         */
    protaelproto.select = function (query) {
      return Snap.selectAll(query);
    };
    /**
         * Get current vew as SVG string.
         * @returns SVG string
         */
    protaelproto.toSVGString = function () {
      return this.paper.toSVGString();
    };
    protaelproto.saveAsSVG = function () {
      //TODO: have to separate style for graph elements and ui elements
      // and use only graph styles for export
      var prefix = "<?xml version=\"1.0\" standalone=\"yes\"?>\n" +
                "<?xml-stylesheet href=\"http://proteins.burnham.org:8080/Protael/css/protael.css\" type=\"text/css\"?>\n" +
                "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\" ",
        subsvg = this.toSVGString(),
        div = document.getElementById(this.container),
        style = "<style type='text/css'><![CDATA[\n" + styles(div) + "\n]]></style>",
        svg = prefix + " " + subsvg.substring(4, subsvg.length - 6) + style + "</svg>",
        blob = new Blob([svg], {"type": "image/svg+xml"});
      // from FileSaver.js
      saveAs(blob, "protael_export.svg");
    };
    // save all page styles as inline styles
    // see http://spin.atomicobject.com/2014/01/21/convert-svg-to-png/
    function isExternal(url) {
      return url && url.lastIndexOf("http", 0) == 0 && url.lastIndexOf(window.location.host) == -1;
    }
    
    function styles(el) {
      var css = "";
      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        if (isExternal(sheets[i].href)) {
          console.warn("Cannot include styles from other hosts: " + sheets[i].href);
          continue;
        }
        var rules = sheets[i].cssRules;
        if (rules != null) {
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (typeof (rule.style) != "undefined") {
              var match = null;
              try {
                match = el.querySelector(rule.selectorText);
              } catch (err) {
                console.warn("Invalid CSS selector \"" + rule.selectorText + "\"", err);
              }
              if (match) {
                var selector = rule.selectorText;
                css += selector + " { " + rule.style.cssText + " }\n";
              } else if (rule.cssText.match(/^@font-face/)) {
                css += rule.cssText + "\n";
              }
            }
          }
        }
      }
      return css;
    }
    
    protaelproto.addDefinition = function (defpath, label, transform) {
      this.paper.addDef(defpath, label, transform);
    };

    protaelproto.tooltip = function (callback) {
      if (callback && typeof (callback) == "function") {
        this.tooltipCallback = callback;
      } else {
        this.tooltipCallback = function () {
          var element = $(this);
          if (element.is("[data-d]")) {
            var data = element.data("d"), res = "<table>";
            for (var i in data) {
              if (i === "pdbid") {
                res += "<tr><td colspan=\"2\"><img src=\"http://www.rcsb.org/pdb/images/" + data[i] + "_bio_r_250.jpg\"></td></tr>";
              } else {
                res += "<tr><td>" + i + ":</td><td>" + data[i] + "</td></tr>";
              }
            }
            res += "</table>";
            return res;
          } else if (element.is("[title]")) {
            return element.attr("title");
          } else if (element.is("img")) {
            return element.attr("alt");
          }
        };
      }
      return this;
    };

    protaelproto.initTooltips = function () {
      if (!this.tooltipCallback)
        this.tooltip(null);
      $("#" + this.container).tooltip({
        "track": true,
        "content": this.tooltipCallback,
      });
    };

    protaelproto.initClicks = function () {
      $("[data-x]").click(function () {
        var element = $(this), xrefs = element.data("x");
        if (Object.keys(xrefs).length > 0) {
          var html = "<table>";
          for (var i in xrefs) {
            html += "<tr><td>" + i + ":</td><td><a target=\"_blank\" href=\"" + xrefs[i] + "\">" + xrefs[i] + "</a</td></tr>";
          }
          html += "</table>";
          $("#propsdialog").html(html);
          $("#propsdialog").dialog("open");
        }

      });
    };
  }(Protael.prototype));
  window.Protael = Protael;
  return Protael;
}()); // end of protael definition

/*
 * Support old version
 */
function ProtaelBrowser(protein, container, width, height, controls) {
  Protael(protein, container, controls).draw();
}

// MODIFIED TO WORK WITH MODERN IMPORT

export function protaelFactory(protein, container, controls) {
  return Protael(protein, container, controls);
}
