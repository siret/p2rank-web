var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var LiteMol;
(function (LiteMol) {
    var Viewer;
    (function (Viewer) {
        var DataSources;
        (function (DataSources) {
            var Bootstrap = LiteMol.Bootstrap;
            var Entity = Bootstrap.Entity;
            DataSources.DownloadMolecule = Entity.Transformer.Molecule.downloadMoleculeSource({
                sourceId: 'url-molecule',
                name: 'URL',
                description: 'Download a molecule from the specified Url (if the host server supports cross domain requests).',
                defaultId: 'https://webchemdev.ncbr.muni.cz/CoordinateServer/1tqn/cartoon',
                urlTemplate: function (id) { return id; },
                isFullUrl: true
            });
        })(DataSources = Viewer.DataSources || (Viewer.DataSources = {}));
    })(Viewer = LiteMol.Viewer || (LiteMol.Viewer = {}));
})(LiteMol || (LiteMol = {}));
/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var LiteMol;
(function (LiteMol) {
    var Viewer;
    (function (Viewer) {
        var PDBe;
        (function (PDBe) {
            var Data;
            (function (Data) {
                var Bootstrap = LiteMol.Bootstrap;
                var Entity = Bootstrap.Entity;
                var Transformer = Bootstrap.Entity.Transformer;
                var Visualization = Bootstrap.Visualization;
                // straigtforward
                Data.DownloadMolecule = Transformer.Molecule.downloadMoleculeSource({
                    sourceId: 'pdbe-molecule',
                    name: 'PDBe',
                    description: 'Download a molecule from PDBe.',
                    defaultId: '1cbs',
                    specificFormat: LiteMol.Core.Formats.Molecule.SupportedFormats.mmCIF,
                    urlTemplate: function (id) { return "https://www.ebi.ac.uk/pdbe/static/entry/" + id.toLowerCase() + "_updated.cif"; }
                });
                Data.DownloadBinaryCIFFromCoordinateServer = Bootstrap.Tree.Transformer.action({
                    id: 'molecule-download-bcif-from-coordinate-server',
                    name: 'Molecule (BinaryCIF)',
                    description: 'Download full or cartoon representation of a PDB entry from the CoordinateServer.',
                    from: [Entity.Root],
                    to: [Entity.Action],
                    defaultParams: function (ctx) { return ({ id: '5iv5', type: 'Cartoon', lowPrecisionCoords: true, serverUrl: ctx.settings.get('molecule.downloadBinaryCIFFromCoordinateServer.server') ? ctx.settings.get('molecule.downloadBinaryCIFFromCoordinateServer.server') : 'https://webchemdev.ncbr.muni.cz/CoordinateServer' }); },
                    validateParams: function (p) { return (!p.id || !p.id.trim().length) ? ['Enter Id'] : (!p.serverUrl || !p.serverUrl.trim().length) ? ['Enter CoordinateServer base URL'] : void 0; },
                }, function (context, a, t) {
                    var query = t.params.type === 'Cartoon' ? 'cartoon' : 'full';
                    var id = t.params.id.toLowerCase().trim();
                    var url = "" + t.params.serverUrl + (t.params.serverUrl[t.params.serverUrl.length - 1] === '/' ? '' : '/') + id + "/" + query + "?encoding=bcif&lowPrecisionCoords=" + (t.params.lowPrecisionCoords ? '1' : '2');
                    return Bootstrap.Tree.Transform.build()
                        .add(a, Entity.Transformer.Data.Download, { url: url, type: 'Binary', id: id })
                        .then(Entity.Transformer.Molecule.CreateFromData, { format: LiteMol.Core.Formats.Molecule.SupportedFormats.mmBCIF }, { isBinding: true })
                        .then(Entity.Transformer.Molecule.CreateModel, { modelIndex: 0 }, { isBinding: false });
                });
                // this creates the electron density based on the spec you sent me
                Data.DownloadDensity = Bootstrap.Tree.Transformer.action({
                    id: 'pdbe-density-download-data',
                    name: 'Density Data from PDBe',
                    description: 'Download density data from PDBe.',
                    from: [Entity.Root],
                    to: [Entity.Action],
                    defaultParams: function () { return ({ id: '1cbs' }); },
                    validateParams: function (p) { return (!p.id || !p.id.trim().length) ? ['Enter Id'] : void 0; },
                }, function (context, a, t) {
                    var action = Bootstrap.Tree.Transform.build();
                    var id = t.params.id.trim().toLocaleLowerCase();
                    var group = action.add(a, Transformer.Basic.CreateGroup, { label: id, description: 'Density' }, { ref: t.props.ref });
                    var diff = group
                        .then(Transformer.Data.Download, { url: "https://www.ebi.ac.uk/pdbe/coordinates/files/" + id + "_diff.ccp4", type: 'Binary', id: t.params.id, description: 'Fo-Fc' })
                        .then(Transformer.Density.ParseData, { format: LiteMol.Core.Formats.Density.SupportedFormats.CCP4, id: 'Fo-Fc', normalize: false }, { isBinding: true });
                    diff
                        .then(Transformer.Density.CreateVisualBehaviour, {
                        id: 'Fo-Fc(-ve)',
                        isoSigmaMin: -5,
                        isoSigmaMax: 0,
                        minRadius: 0,
                        maxRadius: 10,
                        radius: 5,
                        showFull: false,
                        style: Visualization.Density.Style.create({
                            isoValue: -3,
                            isoValueType: Bootstrap.Visualization.Density.IsoValueType.Sigma,
                            color: LiteMol.Visualization.Color.fromHex(0xBB3333),
                            isWireframe: true,
                            transparency: { alpha: 1.0 }
                        })
                    });
                    diff
                        .then(Transformer.Density.CreateVisualBehaviour, {
                        id: 'Fo-Fc(+ve)',
                        isoSigmaMin: 0,
                        isoSigmaMax: 5,
                        minRadius: 0,
                        maxRadius: 10,
                        radius: 5,
                        showFull: false,
                        style: Visualization.Density.Style.create({
                            isoValue: 3,
                            isoValueType: Bootstrap.Visualization.Density.IsoValueType.Sigma,
                            color: LiteMol.Visualization.Color.fromHex(0x33BB33),
                            isWireframe: true,
                            transparency: { alpha: 1.0 }
                        })
                    });
                    var base = group
                        .then(Transformer.Data.Download, { url: "https://www.ebi.ac.uk/pdbe/coordinates/files/" + id + ".ccp4", type: 'Binary', id: t.params.id, description: '2Fo-Fc' })
                        .then(Transformer.Density.ParseData, { format: LiteMol.Core.Formats.Density.SupportedFormats.CCP4, id: '2Fo-Fc', normalize: false }, { isBinding: true })
                        .then(Transformer.Density.CreateVisualBehaviour, {
                        id: '2Fo-Fc',
                        isoSigmaMin: 0,
                        isoSigmaMax: 2,
                        minRadius: 0,
                        maxRadius: 10,
                        radius: 5,
                        showFull: false,
                        style: Visualization.Density.Style.create({
                            isoValue: 1.5,
                            isoValueType: Bootstrap.Visualization.Density.IsoValueType.Sigma,
                            color: LiteMol.Visualization.Color.fromHex(0x3362B2),
                            isWireframe: false,
                            transparency: { alpha: 0.45 }
                        })
                    });
                    return action;
                }, "Electron density loaded, click on a residue or an atom to view the data.");
            })(Data = PDBe.Data || (PDBe.Data = {}));
        })(PDBe = Viewer.PDBe || (Viewer.PDBe = {}));
    })(Viewer = LiteMol.Viewer || (LiteMol.Viewer = {}));
})(LiteMol || (LiteMol = {}));
/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var LiteMol;
(function (LiteMol) {
    var Viewer;
    (function (Viewer) {
        var PDBe;
        (function (PDBe) {
            var Validation;
            (function (Validation) {
                var Entity = LiteMol.Bootstrap.Entity;
                var Transformer = LiteMol.Bootstrap.Entity.Transformer;
                Validation.Report = Entity.create({ name: 'PDBe Molecule Validation Report', typeClass: 'Behaviour', shortName: 'VR', description: 'Represents PDBe validation report.' });
                var Api;
                (function (Api) {
                    function getResidueId(seqNumber, insCode) {
                        var id = seqNumber.toString();
                        if ((insCode || "").length !== 0)
                            id += " " + insCode;
                        return id;
                    }
                    Api.getResidueId = getResidueId;
                    function getEntry(report, modelId, entity, asymId, residueId) {
                        var e = report[entity];
                        if (!e)
                            return void 0;
                        e = e[asymId];
                        if (!e)
                            return void 0;
                        e = e[modelId];
                        if (!e)
                            return void 0;
                        return e[residueId];
                    }
                    Api.getEntry = getEntry;
                    function createReport(data) {
                        var report = {};
                        if (!data.molecules)
                            return report;
                        for (var _i = 0, _a = data.molecules; _i < _a.length; _i++) {
                            var entity = _a[_i];
                            var chains = {};
                            for (var _c = 0, _d = entity.chains; _c < _d.length; _c++) {
                                var chain = _d[_c];
                                var models = {};
                                for (var _e = 0, _f = chain.models; _e < _f.length; _e++) {
                                    var model = _f[_e];
                                    var residues = {};
                                    for (var _g = 0, _h = model.residues; _g < _h.length; _g++) {
                                        var residue = _h[_g];
                                        var id = getResidueId(residue.residue_number, residue.author_insertion_code), entry = residues[id];
                                        if (entry) {
                                            entry.residues.push(residue);
                                            entry.numIssues = Math.max(entry.numIssues, residue.outlier_types.length);
                                        }
                                        else {
                                            residues[id] = {
                                                residues: [residue],
                                                numIssues: residue.outlier_types.length
                                            };
                                        }
                                    }
                                    models[model.model_id.toString()] = residues;
                                }
                                chains[chain.struct_asym_id] = models;
                            }
                            report[entity.entity_id.toString()] = chains;
                        }
                        return report;
                    }
                    Api.createReport = createReport;
                })(Api || (Api = {}));
                var Interactivity;
                (function (Interactivity) {
                    var Behaviour = (function () {
                        function Behaviour(context, report) {
                            var _this = this;
                            this.context = context;
                            this.report = report;
                            this.provider = function (info) {
                                try {
                                    return _this.processInfo(info);
                                }
                                catch (e) {
                                    console.error('Error showing validation label', e);
                                    return void 0;
                                }
                            };
                        }
                        Behaviour.prototype.dispose = function () {
                            this.context.highlight.removeProvider(this.provider);
                        };
                        Behaviour.prototype.register = function (behaviour) {
                            this.context.highlight.addProvider(this.provider);
                        };
                        Behaviour.prototype.processInfo = function (info) {
                            var i = LiteMol.Bootstrap.Interactivity.Molecule.transformInteraction(info);
                            if (!i || i.residues.length > 1)
                                return void 0;
                            var r = i.residues[0];
                            var e = Api.getEntry(this.report, i.modelId, r.chain.entity.entityId, r.chain.asymId, Api.getResidueId(r.seqNumber, r.insCode));
                            if (!e)
                                return void 0;
                            var label;
                            if (e.residues.length === 1) {
                                var vr = e.residues[0];
                                label = 'Validation: ';
                                if (!vr.outlier_types.length)
                                    label += 'no issue';
                                else
                                    label += "<b>" + e.residues[0].outlier_types.join(", ") + "</b>";
                                return label;
                            }
                            else {
                                label = '';
                                var index = 0;
                                for (var _i = 0, _a = e.residues; _i < _a.length; _i++) {
                                    var v = _a[_i];
                                    if (index > 0)
                                        label += ', ';
                                    label += "Validation (altLoc " + v.alt_code + "): <b>" + v.outlier_types.join(", ") + "</b>";
                                    index++;
                                }
                                return label;
                            }
                        };
                        return Behaviour;
                    }());
                    Interactivity.Behaviour = Behaviour;
                })(Interactivity || (Interactivity = {}));
                var Theme;
                (function (Theme) {
                    var colorMap = (function () {
                        var colors = new Map();
                        colors.set(0, { r: 0, g: 1, b: 0 });
                        colors.set(1, { r: 1, g: 1, b: 0 });
                        colors.set(2, { r: 1, g: 0.5, b: 0 });
                        colors.set(3, { r: 1, g: 0, b: 0 });
                        return colors;
                    })();
                    var defaultColor = { r: 0.6, g: 0.6, b: 0.6 };
                    var selectionColor = { r: 0, g: 0, b: 1 };
                    var highlightColor = { r: 1, g: 0, b: 1 };
                    function createResidueMapNormal(model, report) {
                        var map = new Uint8Array(model.residues.count);
                        var mId = model.modelId;
                        var _a = model.residues, asymId = _a.asymId, entityId = _a.entityId, seqNumber = _a.seqNumber, insCode = _a.insCode;
                        for (var i = 0, _b = model.residues.count; i < _b; i++) {
                            var e = Api.getEntry(report, mId, entityId[i], asymId[i], Api.getResidueId(seqNumber[i], insCode[i]));
                            if (e) {
                                map[i] = Math.min(e.numIssues, 3);
                            }
                        }
                        return map;
                    }
                    function createResidueMapComputed(model, report) {
                        var map = new Uint8Array(model.residues.count);
                        var mId = model.modelId;
                        var parent = model.parent;
                        var _a = model.residues, entityId = _a.entityId, seqNumber = _a.seqNumber, insCode = _a.insCode, chainIndex = _a.chainIndex;
                        var sourceChainIndex = model.chains.sourceChainIndex;
                        var asymId = parent.chains.asymId;
                        for (var i = 0, _b = model.residues.count; i < _b; i++) {
                            var aId = asymId[sourceChainIndex[chainIndex[i]]];
                            var e = Api.getEntry(report, mId, entityId[i], aId, Api.getResidueId(seqNumber[i], insCode[i]));
                            if (e) {
                                map[i] = Math.min(e.numIssues, 3);
                            }
                        }
                        return map;
                    }
                    function create(entity, report) {
                        var model = entity.props.model;
                        var map = model.source === LiteMol.Core.Structure.MoleculeModelSource.File
                            ? createResidueMapNormal(model, report)
                            : createResidueMapComputed(model, report);
                        var colors = new Map();
                        colors.set('Uniform', defaultColor);
                        colors.set('Selection', selectionColor);
                        colors.set('Highlight', highlightColor);
                        var residueIndex = model.atoms.residueIndex;
                        var mapping = LiteMol.Visualization.Theme.createColorMapMapping(function (i) { return map[residueIndex[i]]; }, colorMap, defaultColor);
                        return LiteMol.Visualization.Theme.createMapping(mapping, { colors: colors, interactive: true, transparency: { alpha: 1.0 } });
                    }
                    Theme.create = create;
                })(Theme || (Theme = {}));
                var Create = LiteMol.Bootstrap.Tree.Transformer.create({
                    id: 'pdbe-validation-create',
                    name: 'PDBe Validation',
                    description: 'Create the validation report from a string.',
                    from: [Entity.Data.String],
                    to: [Validation.Report],
                    defaultParams: function () { return ({}); }
                }, function (context, a, t) {
                    return LiteMol.Bootstrap.Task.create("Validation Report (" + t.params.id + ")", 'Normal', function (ctx) {
                        ctx.update('Parsing...');
                        ctx.schedule(function () {
                            var data = JSON.parse(a.props.data);
                            var model = data[t.params.id];
                            var report = Api.createReport(model || {});
                            ctx.resolve(Validation.Report.create(t, { label: 'Validation Report', behaviour: new Interactivity.Behaviour(context, report) }));
                        });
                    }).setReportTime(true);
                });
                Validation.DownloadAndCreate = LiteMol.Bootstrap.Tree.Transformer.action({
                    id: 'pdbe-validation-download-and-create',
                    name: 'PDBe Validation Report',
                    description: 'Download Validation Report from PDBe',
                    from: [Entity.Molecule.Molecule],
                    to: [Entity.Action],
                    defaultParams: function () { return ({}); }
                }, function (context, a, t) {
                    var id = a.props.molecule.id.trim().toLocaleLowerCase();
                    var action = LiteMol.Bootstrap.Tree.Transform.build()
                        .add(a, Transformer.Data.Download, { url: "https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/" + id, type: 'String', id: id, description: 'Validation Data' })
                        .then(Create, { id: id }, { isBinding: true });
                    return action;
                }, "Validation report loaded. Hovering over residue will now contain validation info. To apply validation coloring, select the entity in the tree and apply it the right panel.");
                Validation.ApplyTheme = LiteMol.Bootstrap.Tree.Transformer.create({
                    id: 'pdbe-validation-apply-theme',
                    name: 'Apply Coloring',
                    description: 'Colors all visuals using the validation report.',
                    from: [Validation.Report],
                    to: [Entity.Action],
                    defaultParams: function () { return ({}); }
                }, function (context, a, t) {
                    return LiteMol.Bootstrap.Task.create('Validation Coloring', 'Background', function (ctx) {
                        var molecule = LiteMol.Bootstrap.Tree.Node.findAncestor(a, LiteMol.Bootstrap.Entity.Molecule.Molecule);
                        if (!molecule) {
                            ctx.reject('No suitable parent found.');
                            return;
                        }
                        var themes = new Map();
                        var visuals = context.select(LiteMol.Bootstrap.Tree.Selection.byValue(molecule).subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual));
                        for (var _i = 0, visuals_1 = visuals; _i < visuals_1.length; _i++) {
                            var v = visuals_1[_i];
                            var model = LiteMol.Bootstrap.Utils.Molecule.findModel(v);
                            if (!model)
                                continue;
                            var theme = themes.get(model.id);
                            if (!theme) {
                                theme = Theme.create(model, a.props.behaviour.report);
                                themes.set(model.id, theme);
                            }
                            LiteMol.Bootstrap.Command.Visual.UpdateBasicTheme.dispatch(context, { visual: v, theme: theme });
                        }
                        context.logger.message('Validation coloring applied.');
                        ctx.resolve(LiteMol.Bootstrap.Tree.Node.Null);
                    });
                });
            })(Validation = PDBe.Validation || (PDBe.Validation = {}));
        })(PDBe = Viewer.PDBe || (Viewer.PDBe = {}));
    })(Viewer = LiteMol.Viewer || (LiteMol.Viewer = {}));
})(LiteMol || (LiteMol = {}));
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Bootstrap = LiteMol.Bootstrap;
        var Entity = Bootstrap.Entity;
        PrankWeb.Sequence = Entity.create({
            name: 'Protein sequence',
            typeClass: 'Data',
            shortName: 'PS',
            description: 'Represents sequence of the protein.'
        });
        PrankWeb.CreateSequence = Bootstrap.Tree.Transformer.create({
            id: 'protein-sequence-create',
            name: 'Protein sequence',
            description: 'Create protein sequence from string.',
            from: [Entity.Data.String],
            to: [PrankWeb.Sequence],
            defaultParams: function () { return ({}); }
        }, function (context, a, t) {
            return Bootstrap.Task.create("Create sequence entity", 'Normal', function (ctx) {
                ctx.update('Creating sequence entity...');
                ctx.schedule(function () {
                    var seq = a.props.data;
                    console.log("Sekvence: " + seq);
                    ctx.resolve(PrankWeb.Sequence.create(t, { label: 'Sequence', seq: seq }));
                });
            }).setReportTime(true);
        });
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Bootstrap = LiteMol.Bootstrap;
        var Entity = Bootstrap.Entity;
        PrankWeb.Prediction = Entity.create({
            name: 'Pocket prediction',
            typeClass: 'Data',
            shortName: 'PP',
            description: 'Represents predicted protein-ligand binding pockets.'
        });
        PrankWeb.ParseAndCreatePrediction = Bootstrap.Tree.Transformer.create({
            id: 'protein-pocket-prediction-parse',
            name: 'Protein predicted pockets',
            description: 'Parse protein pocket prediction.',
            from: [Entity.Data.String],
            to: [PrankWeb.Prediction],
            defaultParams: function () { return ({}); }
        }, function (context, a, t) {
            return Bootstrap.Task.create("Parse protein prediction entity.", 'Normal', function (ctx) {
                ctx.update('Parsing prediction data...');
                ctx.schedule(function () {
                    var csvData = a.props.data;
                    var result = [];
                    try {
                        var lines = csvData.split('\n');
                        var h = 0;
                        var HSVtoRGB = function (h, s, v) {
                            var r, g, b, i, f, p, q, t;
                            // if (arguments.length === 1) {
                            //     s = h.s, v = h.v, h = h.h;
                            // }
                            i = Math.floor(h * 6);
                            f = h * 6 - i;
                            p = v * (1 - s);
                            q = v * (1 - f * s);
                            t = v * (1 - (1 - f) * s);
                            switch (i % 6) {
                                case 0:
                                    r = v, g = t, b = p;
                                    break;
                                case 1:
                                    r = q, g = v, b = p;
                                    break;
                                case 2:
                                    r = p, g = v, b = t;
                                    break;
                                case 3:
                                    r = p, g = q, b = v;
                                    break;
                                case 4:
                                    r = t, g = p, b = v;
                                    break;
                                case 5:
                                    r = v, g = p, b = q;
                                    break;
                            }
                            console.log(r * 255, g * 255, b * 255);
                            return LiteMol.Visualization.Color.fromRgb(r * 255, g * 255, b * 255);
                        };
                        var colors = Array(6);
                        colors[0] = LiteMol.Visualization.Color.fromHexString("#e74c3c");
                        colors[1] = LiteMol.Visualization.Color.fromHexString("#00ffff");
                        colors[2] = LiteMol.Visualization.Color.fromHexString("#2ecc71");
                        colors[3] = LiteMol.Visualization.Color.fromHexString("#9b59b6");
                        colors[4] = LiteMol.Visualization.Color.fromHexString("#00007f");
                        colors[5] = LiteMol.Visualization.Color.fromHexString("#e67e22");
                        var _loop_1 = function (i) {
                            // h = h + (1/6)
                            // if (h >= 1) { h = h-1 }
                            var fields = lines[i].split(',');
                            if (fields.length < 10)
                                return "continue";
                            var resIds = [];
                            fields[8].split(' ').forEach(function (value) { resIds.push(parseInt(value)); });
                            var surfAtoms = [];
                            fields[9].split(' ').forEach(function (value) { surfAtoms.push(parseInt(value)); });
                            result.push({
                                name: fields[0],
                                rank: parseFloat(fields[1]),
                                score: parseFloat(fields[2]),
                                conollyPoints: parseFloat(fields[3]),
                                surfAtoms: parseFloat(fields[4]),
                                centerX: parseFloat(fields[5]),
                                centerY: parseFloat(fields[6]),
                                centerZ: parseFloat(fields[7]),
                                residueIds: resIds,
                                surfAtomIds: surfAtoms,
                                color: colors[(i - 1) % 6]
                            });
                        };
                        for (var i = 1; i < lines.length; i++) {
                            _loop_1(i);
                        }
                    }
                    catch (e) {
                        console.log("Exception catched during parsing.");
                    }
                    ctx.resolve(PrankWeb.Prediction.create(t, { label: 'Sequence', pockets: result }));
                });
            }).setReportTime(true);
        });
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Bootstrap = LiteMol.Bootstrap;
        var SequenceController = (function (_super) {
            __extends(SequenceController, _super);
            function SequenceController(context) {
                var _this = _super.call(this, context, { seq: "", pockets: [] }) || this;
                Bootstrap.Event.Tree.NodeAdded.getStream(context).subscribe(function (e) {
                    if (e.data.type === PrankWeb.Sequence) {
                        _this.setState({ seq: e.data.props.seq, pockets: _this.latestState.pockets });
                    }
                    else if (e.data.type === PrankWeb.Prediction) {
                        _this.setState({ seq: _this.latestState.seq, pockets: e.data.props.pockets });
                    }
                });
                return _this;
            }
            return SequenceController;
        }(Bootstrap.Components.Component));
        PrankWeb.SequenceController = SequenceController;
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Plugin = LiteMol.Plugin;
        var Views = Plugin.Views;
        var Bootstrap = LiteMol.Bootstrap;
        var React = LiteMol.Plugin.React; // this is to enable the HTML-like syntax
        var CacheItem = (function () {
            function CacheItem(query, selectionInfo) {
                this.query = query;
                this.selectionInfo = selectionInfo;
            }
            return CacheItem;
        }());
        var Feature = (function () {
            function Feature(cat, typ, start, end, text) {
                this.category = cat;
                this.type = typ;
                this.start = start;
                this.end = end;
                this.text = text;
            }
            return Feature;
        }());
        var SequenceView = (function (_super) {
            __extends(SequenceView, _super);
            function SequenceView() {
                return _super.apply(this, arguments) || this;
            }
            SequenceView.prototype.getResidue = function (seqNumber, model) {
                var ctx = this.controller.context;
                var cache = ctx.entityCache;
                var cacheId = "__resSelectionInfo-" + seqNumber;
                var item = cache.get(model, cacheId);
                if (!item) {
                    var selectionQ = LiteMol.Core.Structure.Query.residuesById(seqNumber); //Core.Structure.Query.chains({ authAsymId: 'A' })
                    var elements = model.props.model.query(selectionQ).unionAtomIndices();
                    var selection = Bootstrap.Interactivity.Info.selection(model, elements);
                    var selectionInfo = Bootstrap.Interactivity.Molecule.transformInteraction(selection);
                    item = new CacheItem(selectionQ, selectionInfo);
                    cache.set(model, cacheId, item);
                }
                return item;
            };
            SequenceView.prototype.componentWillMount = function () {
                _super.prototype.componentWillMount.call(this);
                //this.subscribe(Bootstrap.Event.Common.LayoutChanged.getStream(this.controller.context), () => this.scrollToBottom());
            };
            SequenceView.prototype.componentDidUpdate = function () {
                //this.scrollToBottom();
                var pockets = this.controller.latestState.pockets;
                var pviz = getPviz();
                var seqEntry = new pviz.SeqEntry({ sequence: this.controller.latestState.seq });
                new pviz.SeqEntryAnnotInteractiveView({
                    model: seqEntry, el: '#seqView',
                    xChangeCallback: function (pStart, pEnd) {
                        // this.onLetterMouseEnter(Math.round(pStart));
                    }
                }).render();
                var features = [];
                pockets.forEach(function (pocket, i) {
                    pocket.residueIds.sort(function (a, b) { return a - b; });
                    var lastStart = -1;
                    var lastResNum = -1;
                    pocket.residueIds.forEach(function (resNum, y) {
                        if (y == 0) {
                            lastStart = resNum;
                        }
                        else {
                            if (lastResNum + 1 < resNum) {
                                features.push(new Feature("Pockets", "col" + i % 6, lastStart, lastResNum, pocket.rank.toString()));
                                lastStart = resNum;
                            }
                        }
                        lastResNum = resNum;
                    });
                    features.push(new Feature("Pockets", "col" + i % 6, lastStart, lastResNum, pocket.rank.toString()));
                });
                var getColor = function (seqId) {
                    var color = LiteMol.Visualization.Color.fromRgb(255, 255, 255);
                    var colorSet = false;
                    pockets.forEach(function (pocket) {
                        if (pocket.residueIds.indexOf(seqId) >= 0) {
                            if (!colorSet) {
                                color = pocket.color;
                                colorSet = true;
                            }
                            else {
                                console.log(seqId.toString() + " is in at least two pockets!");
                            }
                        }
                    });
                    return color;
                };
                seqEntry.addFeatures(features);
            };
            SequenceView.prototype.onLetterMouseEnter = function (seqNumber) {
                var ctx = this.controller.context;
                var model = ctx.select('model')[0];
                if (!model)
                    return;
                // Get the sequence selection
                var seqSel = this.getResidue(seqNumber, model);
                // Highlight in the 3D Visualization
                if (this.lastSelectedSeq) {
                    Bootstrap.Command.Molecule.Highlight.dispatch(ctx, { model: model, query: this.lastSelectedSeq.query, isOn: false });
                }
                Bootstrap.Command.Molecule.Highlight.dispatch(ctx, { model: model, query: seqSel.query, isOn: true });
                this.lastSelectedSeq = seqSel;
                // if (isOn) {
                // Show tooltip
                var label = Bootstrap.Interactivity.Molecule.formatInfo(seqSel.selectionInfo);
                Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label /*, 'some additional label'*/]);
                // } else {
                // Hide tooltip
                // Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [])
                // }
            };
            SequenceView.prototype.onLetterClick = function (seqNumber, letter) {
                var ctx = this.controller.context;
                var model = ctx.select('model')[0];
                if (!model)
                    return;
                var query = this.getResidue(seqNumber, model).query;
                Bootstrap.Command.Molecule.FocusQuery.dispatch(ctx, { model: model, query: query });
            };
            SequenceView.prototype.render = function () {
                var seq = this.controller.latestState.seq.split('');
                var pockets = this.controller.latestState.pockets;
                var ctx = this.controller.context;
                var seqToPrint = [];
                seq.forEach(function (letter, i) {
                    seqToPrint.push(letter);
                    if ((i + 1) % 10 == 0) {
                        seqToPrint.push(' ');
                    }
                });
                var colorToString = function (color) {
                    return 'rgb(' + (color.r * 255) + ',' + (color.g * 255) + ',' + (color.b * 255) + ')';
                };
                var seqId = -1;
                return React.createElement("div", { id: "seqView" });
                // return (<div className='protein-seq' style={{ fontFamily: 'Consolas, "Courier New", monospace', fontSize: 'large' }}>
                //     {seqToPrint.map((letter, i) => {
                //         if (letter === ' ') {
                //             return <span className="space"> </span>
                //         } else {
                //             seqId++
                //             return <span
                //                 id={'res' + seqId.toString()}
                //                 onMouseEnter={this.onLetterMouseEnter.bind(this, seqId, letter, true)}
                //                 onMouseLeave={this.onLetterMouseEnter.bind(this, seqId, letter, false)}
                //                 onClick={this.onLetterClick.bind(this, seqId, letter)}
                //                 style={{ color: colorToString(getColor(seqId)) }}
                //                 >{letter}</span>
                //         }
                //     })
                //     }
                // </div>);
            };
            return SequenceView;
        }(Views.View));
        PrankWeb.SequenceView = SequenceView;
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Plugin = LiteMol.Plugin;
        var Views = Plugin.Views;
        var Bootstrap = LiteMol.Bootstrap;
        var React = LiteMol.Plugin.React; // this is to enable the HTML-like syntax
        var PocketController = (function (_super) {
            __extends(PocketController, _super);
            function PocketController(context) {
                var _this = _super.call(this, context, { pockets: [] }) || this;
                Bootstrap.Event.Tree.NodeAdded.getStream(context).subscribe(function (e) {
                    if (e.data.type === PrankWeb.Prediction) {
                        _this.setState({ pockets: e.data.props.pockets });
                    }
                });
                return _this;
            }
            return PocketController;
        }(Bootstrap.Components.Component));
        PrankWeb.PocketController = PocketController;
        var CacheItem = (function () {
            function CacheItem(query, selectionInfo) {
                this.query = query;
                this.selectionInfo = selectionInfo;
            }
            return CacheItem;
        }());
        var PocketList = (function (_super) {
            __extends(PocketList, _super);
            function PocketList() {
                return _super.apply(this, arguments) || this;
            }
            PocketList.prototype.getPocket = function (pocket, model) {
                var ctx = this.controller.context;
                var cache = ctx.entityCache;
                var cacheId = "__pocketSelectionInfo-" + pocket.name;
                var item = cache.get(model, cacheId);
                if (!item) {
                    var selectionQ = LiteMol.Core.Structure.Query.atomsById.apply(null, pocket.surfAtomIds); //Core.Structure.Query.chains({ authAsymId: 'A' })
                    var elements = model.props.model.query(selectionQ).unionAtomIndices();
                    var selection = Bootstrap.Interactivity.Info.selection(model, elements);
                    var selectionInfo = Bootstrap.Interactivity.Molecule.transformInteraction(selection);
                    item = new CacheItem(selectionQ, selectionInfo);
                    cache.set(model, cacheId, item);
                }
                return item;
            };
            PocketList.prototype.componentWillMount = function () {
                _super.prototype.componentWillMount.call(this);
                //this.subscribe(Bootstrap.Event.Common.LayoutChanged.getStream(this.controller.context), () => this.scrollToBottom());
            };
            PocketList.prototype.componentDidUpdate = function () {
                //this.scrollToBottom();
            };
            PocketList.prototype.onLetterMouseEnter = function (pocket, isOn) {
                var ctx = this.controller.context;
                var model = ctx.select('model')[0];
                if (!model)
                    return;
                // Get the sequence selection
                var pocketSel = this.getPocket(pocket, model);
                // Highlight in the 3D Visualization
                Bootstrap.Command.Molecule.Highlight.dispatch(ctx, { model: model, query: pocketSel.query, isOn: isOn });
                if (isOn) {
                    // Show tooltip
                    var label = Bootstrap.Interactivity.Molecule.formatInfo(pocketSel.selectionInfo);
                    Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label, "" + pocket.name]);
                }
                else {
                    // Hide tooltip
                    Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, []);
                }
            };
            PocketList.prototype.onLetterClick = function (pocket) {
                var ctx = this.controller.context;
                var model = ctx.select('model')[0];
                if (!model)
                    return;
                var query = this.getPocket(pocket, model).query;
                Bootstrap.Command.Molecule.FocusQuery.dispatch(ctx, { model: model, query: query });
            };
            PocketList.prototype.render = function () {
                var _this = this;
                var pockets = this.controller.latestState.pockets;
                var ctx = this.controller.context;
                var colorToString = function (color) {
                    return 'rgb(' + (color.r * 255) + ',' + (color.g * 255) + ',' + (color.b * 255) + ')';
                };
                return (React.createElement("div", { className: "pocket-list" }, pockets.map(function (pocket, i) {
                    return React.createElement("div", { className: "pocket col-sm-6 col-xs-12", style: { borderColor: colorToString(pocket.color) }, onMouseEnter: _this.onLetterMouseEnter.bind(_this, pocket, true), onMouseLeave: _this.onLetterMouseEnter.bind(_this, pocket, false), onClick: _this.onLetterClick.bind(_this, pocket) },
                        React.createElement("dl", null,
                            React.createElement("dt", null, "Pocket name"),
                            React.createElement("dd", null, pocket.name),
                            React.createElement("dt", null, "Pocket rank"),
                            React.createElement("dd", null, pocket.rank),
                            React.createElement("dt", null, "Pocket score"),
                            React.createElement("dd", null, pocket.score)));
                })));
            };
            return PocketList;
        }(Views.View));
        PrankWeb.PocketList = PocketList;
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var LiteMol;
(function (LiteMol) {
    var PrankWeb;
    (function (PrankWeb) {
        var Plugin = LiteMol.Plugin;
        var Query = LiteMol.Core.Structure.Query;
        var Views = Plugin.Views;
        var Bootstrap = LiteMol.Bootstrap;
        var Transformer = Bootstrap.Entity.Transformer;
        var LayoutRegion = Bootstrap.Components.LayoutRegion;
        function create(target) {
            var spec = {
                settings: {},
                transforms: [],
                behaviours: [
                    // you will find the source of all behaviours in the Bootstrap/Behaviour directory
                    Bootstrap.Behaviour.SetEntityToCurrentWhenAdded,
                    Bootstrap.Behaviour.FocusCameraOnSelect,
                    Bootstrap.Behaviour.UnselectElementOnRepeatedClick,
                    // this colors the visual when a selection is created on it.
                    //Bootstrap.Behaviour.ApplySelectionToVisual,
                    // this colors the visual when it's selected by mouse or touch
                    Bootstrap.Behaviour.ApplyInteractivitySelection,
                    // this shows what atom/residue is the pointer currently over
                    Bootstrap.Behaviour.Molecule.HighlightElementInfo,
                    // distance to the last "clicked" element
                    Bootstrap.Behaviour.Molecule.DistanceToLastClickedElement,
                    // when somethinh is selected, this will create an "overlay visual" of the selected residue and show every other residue within 5ang
                    // you will not want to use this for the ligand pages, where you create the same thing this does at startup
                    //Bootstrap.Behaviour.Molecule.ShowInteractionOnSelect(5),                
                    // this tracks what is downloaded and some basic actions. Does not send any private data etc.
                    // While it is not required for any functionality, we as authors are very much interested in basic 
                    // usage statistics of the application and would appriciate if this behaviour is used.
                    Bootstrap.Behaviour.GoogleAnalytics('UA-77062725-1')
                ],
                components: [
                    Plugin.Components.Visualization.HighlightInfo(LayoutRegion.Main, true),
                    //Plugin.Components.Context.Log(LayoutRegion.Bottom, true),
                    Plugin.Components.create('PrankWeb.SequenceView', function (s) { return new PrankWeb.SequenceController(s); }, PrankWeb.SequenceView)(LayoutRegion.Top, true),
                    Plugin.Components.Context.Overlay(LayoutRegion.Root),
                    Plugin.Components.Context.BackgroundTasks(LayoutRegion.Main, true)
                ],
                viewport: {
                    view: Views.Visualization.Viewport,
                    controlsView: Views.Visualization.ViewportControls
                },
                layoutView: Views.Layout,
                tree: { region: LayoutRegion.Left, view: Views.Entity.Tree }
            };
            var plugin = Plugin.create({ target: target, customSpecification: spec });
            plugin.context.logger.message("LiteMol " + Plugin.VERSION.number);
            return plugin;
        }
        PrankWeb.create = create;
        var appNode = document.getElementById('app');
        var pocketNode = document.getElementById('pockets');
        var pdbId = appNode.getAttribute("data-pdbid");
        var plugin = create(appNode);
        LiteMol.Plugin.ReactDOM.render(LiteMol.Plugin.React.createElement(PrankWeb.PocketList, { controller: new PrankWeb.PocketController(plugin.context) }), pocketNode);
        var downloadAction = Bootstrap.Tree.Transform.build()
            .add(plugin.root, Transformer.Data.Download, { url: "/api/csv/" + pdbId, type: 'String' }, { isHidden: true })
            .then(PrankWeb.ParseAndCreatePrediction, {}, { ref: 'pockets', isHidden: true })
            .add(plugin.root, Transformer.Data.Download, { url: "/api/seq/" + pdbId, type: 'String' }, { isHidden: true })
            .then(PrankWeb.CreateSequence, {}, { ref: 'sequence', isHidden: true });
        plugin.applyTransform(downloadAction).then(function () {
            var pockets = plugin.context.select('pockets')[0].props.pockets;
            var seqData = plugin.context.select('sequence')[0].props.data;
            LiteMol.Bootstrap.Command.Layout.SetState.dispatch(plugin.context, {
                isExpanded: false,
                hideControls: false
            });
            /**
             * Selection of a specific set of atoms...
             */
            var selectionQueries = [];
            var allPocketIds = [];
            pockets.forEach(function (pocket) {
                selectionQueries.push(Query.atomsById.apply(null, pocket.surfAtomIds));
                pocket.surfAtomIds.forEach(function (id) { allPocketIds.push(id); });
                // __LiteMolReact.__DOM.render(__LiteMolReact.createElement('p', {}, 'Ahoj'), pocketNode)   
            });
            var selectionColors = Bootstrap.Immutable.Map()
                .set('Uniform', LiteMol.Visualization.Color.fromHex(0xff0000))
                .set('Selection', LiteMol.Visualization.Theme.Default.SelectionColor)
                .set('Highlight', LiteMol.Visualization.Theme.Default.HighlightColor);
            /**
             * Selection of the complement of the previous set.
             */
            var complementQ = Query.atomsById.apply(null, allPocketIds).complement();
            var complementColors = selectionColors.set('Uniform', LiteMol.Visualization.Color.fromHex(0x666666));
            var complementStyle = {
                type: 'Surface',
                params: { probeRadius: 0.5, density: 1.4, smoothing: 4, isWireframe: false },
                theme: { template: Bootstrap.Visualization.Molecule.Default.UniformThemeTemplate, colors: complementColors, transparency: { alpha: 1.0 } }
            };
            // Represent an action to perform on the app state.
            var action = Bootstrap.Tree.Transform.build();
            // This loads the model from PDBe
            var modelAction = action.add(plugin.context.tree.root, Transformer.Data.Download, { url: "/api/mmcif/" + pdbId, type: 'String', description: pdbId })
                .then(Transformer.Data.ParseCif, { id: pdbId, description: pdbId }, { isBinding: true })
                .then(Transformer.Molecule.CreateFromMmCif, { blockIndex: 0 }, { isBinding: true })
                .then(Transformer.Molecule.CreateModel, { modelIndex: 0 }, { isBinding: false, ref: 'model' });
            // Create a selection on the model and then create a visual for it...
            modelAction
                .then(Transformer.Molecule.CreateSelectionFromQuery, { query: complementQ, name: 'Protein', silent: true }, {})
                .then(Transformer.Molecule.CreateVisual, { style: complementStyle }, { isHidden: true });
            selectionQueries.forEach(function (selectionQuery, i) {
                var selectionColor = selectionColors.set('Uniform', pockets[i].color);
                var selectionStyle = {
                    type: 'Surface',
                    params: { probeRadius: 0.5, density: 1.25, smoothing: 3, isWireframe: false },
                    theme: { template: Bootstrap.Visualization.Molecule.Default.UniformThemeTemplate, colors: selectionColor, transparency: { alpha: 0.5 } }
                };
                var sel = modelAction
                    .then(Transformer.Molecule.CreateSelectionFromQuery, { query: selectionQuery, name: pockets[i].name, silent: true }, {});
                sel.then(Transformer.Molecule.CreateVisual, { style: Bootstrap.Visualization.Molecule.Default.ForType.get('BallsAndSticks') }, { isHidden: true });
                sel.then(Transformer.Molecule.CreateVisual, { style: selectionStyle }, { isHidden: true });
            });
            var loadTask = Bootstrap.Tree.Transform.apply(plugin.context, action).run(plugin.context);
            // to access the model after it was loaded...
            loadTask.then(function () {
                var model = plugin.context.select('model')[0];
                if (!model)
                    return;
                //Bootstrap.Command.Molecule.FocusQuery.dispatch(plugin.context, { model, query: selectionQueries });
            });
        });
    })(PrankWeb = LiteMol.PrankWeb || (LiteMol.PrankWeb = {}));
})(LiteMol || (LiteMol = {}));
