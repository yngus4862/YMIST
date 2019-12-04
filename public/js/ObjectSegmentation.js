
widgets = [];
widgetsAvailable = [
    'None',
    'Handle',
    'VoxelProbe',
    'Ruler',
    'BiRuler',
    'CrossRuler',
    'Angle',
    'Rectangle',
    'Ellipse',
    'Polygon',
    'Freehand',
    'Annotation',
];
segmentationGUIObjects = {
    algorithm: 'ITKConnectedThreshold',
    algorithms: ['ITKConnectedThreshold', 'ITKConfidenceConnected', 'ITKConfidenceConnected3D'],
    segmentation: function () {
        if (widgets.length < 1) {
            return;
        }
        let XYZ = getXYZofWidget1();
        var index = XYZ.z;

        const pipelinePath = this.algorithm;
        const args = ['orignal.json', 'segment.json'];
        const outputs = [
            { path: args[1], type: itk.IOTypes.Image }
        ];
        const inputs = [
            { path: args[0], type: itk.IOTypes.Image }
        ];

        switch (this.algorithm) {
            case 'ITKConnectedThreshold':
                itkImage = createITKImage(stack, index);
                inputs[0].data = itkImage;

                args.push(String(XYZ.x));
                args.push(String(XYZ.y));
                args.push(String(r1.stackHelper.slice.lowerThreshold));
                args.push(String(r1.stackHelper.slice.upperThreshold));
                break;
            case 'ITKConfidenceConnected':
                itkImage = createITKImage(stack, index);
                inputs[0].data = itkImage;

                args.push(String(XYZ.x));
                args.push(String(XYZ.y));
                break;
            case 'ITKConfidenceConnected3D':
                itkImage = createITKImage3D(stack);
                inputs[0].data = itkImage;

                args.push(String(XYZ.x));
                args.push(String(XYZ.y));
                args.push(String(XYZ.z));
                break;
            default:
                break;
        }
        itk.runPipelineBrowser(null, pipelinePath, args, outputs, inputs)
            .then(function ({ stdout, stderr, outputs, webWorker }) {
                webWorker.terminate();

                var size = outputs[0].data.size;
                var type = outputs[0].data.imageType;

                if (outputs[0].data.imageType.dimension === 2) {
                    segment.frame[index].pixelData = outputs[0].data.data.slice();

                    itk.writeArrayBuffer(null, false, outputs[0].data, 'segmentation.png', "image/png")
                        .then(function (writeReturn) {
                            //writeReturn.webWorker.terminate();

                            DownloadFile(writeReturn.arrayBuffer, 'segmentation.png');
                        });
                } else if (outputs[0].data.imageType.dimension === 3) {
                    for (var i = 0; i < size[2]; i++) {
                        switch (type.componentType) {
                            case itk.IntTypes.Int8:
                                segment.frame[i].pixelData = new Int8Array(outputs[0].data.data.slice(i * size[0] * size[1], (i + 1) * size[0] * size[1]));
                                break;
                            case itk.IntTypes.UInt8:
                                segment.frame[i].pixelData = new Uint8Array(outputs[0].data.data.slice(i * size[0] * size[1], (i + 1) * size[0] * size[1]));
                                break;
                        }
                    }

                    DownloadFile(outputs[0].data.data, 'segmentation.raw');
                }
                segment._rawData = [];
                segment.pack();

                updateSegmentMaterial(r1);
                updateSegmentMaterial(r2);
                updateSegmentMaterial(r3);
                updateSegmentVolumeMesh(vr);
                allModified();

            });
    },
    widgetType: 'None',
    id: '0',
    segment: 'BackGround',
    color: [0, 0, 0],
    opacity: 0,
    opacityAll: 1.0,
    segmentTarget: 'NewSegment',
    addSegment: function () {
        for (var i = 0; ; i++) {
            if (!this.segments[i]) {
                this.segments[i] = { color: [0, 0, 0], opacity: 1, label: this.segmentTarget };
                this.id = i;
                this.color = this.segments[i].color.slice();
                this.opacity = this.segments[i].opacity;

                break;
            }
        }
        //this.segments[Object.keys(this.segments).length] = { color: [0, 0, 0], opacity: 1, label: this.segmentTarget };
        this.segmentsLabel = [];
        for (var key in this.segments) {
            this.segmentsLabel.push(this.segments[key].label);
        }
        updateDropdown(dropdown, this.segmentsLabel);
        this.segment = this.segments[i].label;
        $(dropdown.domElement).find('[value = ' + this.segment + ']').attr('selected', 'selected');

        segmentHelper.segmentLUT.segmentation = this.segments;

        r1.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        r2.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        r3.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        vr.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
    },
    removeSegment: function () {
        var i = 0;
        for (i in this.segments) {
            if (this.segments[i].label === this.segmentTarget) {
                break;
            }
        }
        if (i !== 0) {
            delete this.segments[i];
        }
        this.segmentsLabel = [];
        for (var key in this.segments) {
            this.segmentsLabel.push(this.segments[key].label);
        }
        updateDropdown(dropdown, this.segmentsLabel);
        this.id = '0';
        this.color = this.segments[0].color.slice();
        this.opacity = this.segments[0].opacity;
        this.segment = this.segments[0].label;
        $(dropdown.domElement).find('[value = ' + this.segment + ']').attr('selected', 'selected');

        segmentHelper.segmentLUT.segmentation = this.segments;

        r1.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        r2.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        r3.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        vr.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
    },
    segmentsLabel: ['BackGround'],
    segments: {
        0: { color: [0, 0, 0], opacity: 0, label: 'BackGround' },
        255: {color: [255, 0, 0], opacity: 1, label: 'Segment'}
    }
};

getXYZofWidget1 = function () {
    var widget_position = widgets[0].worldPosition;
    var origin = stack._origin;
    var spacing = stack._spacing;
    var x = (widget_position.x - origin.x) / spacing.x;
    var y = (widget_position.y - origin.y) / spacing.y;
    var z = (widget_position.z - origin.z) / spacing.z;
    var xyz = { 'x': Math.round(x), 'y': Math.round(y), 'z': Math.round(z) };
    return xyz;
};
getXYZofWidgets = function () {
    var xyzs = [];
    for (var i = 0; i < widgets.length; i++) {
        var widget_position = widgets[i].worldPosition;
        var origin = stack._origin;
        var spacing = stack._spacing;
        var x = (widget_position.x - origin.x) / spacing.x;
        var y = (widget_position.y - origin.y) / spacing.y;
        var z = (widget_position.z - origin.z) / spacing.z;
        var xyz = { 'x': Math.round(x), 'y': Math.round(y), 'z': Math.round(z) };
        xyzs.push()
    }
    return xyzs;
};
offsetsSet = function (rendererObj) {
    const box = rendererObj.domElement.getBoundingClientRect();
    const body = document.body;
    const docEl = document.documentElement;
    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;
    const top = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;
    rendererObj.offsets = {
        top: Math.round(top),
        left: Math.round(left)
    };
};

segmentationGUISetting = function () {
    function onMouseDown(event) {
        for (let widget of widgets) {
            if (widget.hovered) {
                widget.onStart(event);
                return;
            }
        }
        const id = event.target.id;
        var refObj = null;
        switch (id) {
            case '1':
                refObj = r1;
                break;
            case '2':
                refObj = r2;
                break;
            case '3':
                refObj = r3;
                break;
        }
        let mouse = {
            x: ((event.clientX - refObj.offsets.left) / refObj.domElement.offsetWidth) * 2 - 1,
            y: -((event.clientY - refObj.offsets.top) / refObj.domElement.offsetHeight) * 2 + 1
        };
        var stackHelper = refObj.stackHelper;
        var stack = refObj.stackHelper.stack;
        var controls = refObj.controls;
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, refObj.camera);
        let intersects = raycaster.intersectObject(stackHelper.slice.mesh);
        if (intersects.length <= 0) {
            return;
        }
        let widget = null;
        switch (segmentationGUIObjects.widgetType) {
            case 'VoxelProbe':
                widget = new AMI.VoxelProbeWidget(stackHelper.slice.mesh, controls, {
                    stack: stack,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Ruler':
                widget = new AMI.RulerWidget(stackHelper.slice.mesh, controls, {
                    lps2IJK: stack.lps2IJK,
                    pixelSpacing: stack.frame[stackHelper.index].pixelSpacing,
                    ultrasoundRegions: stack.frame[stackHelper.index].ultrasoundRegions,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'CrossRuler':
                widget = new AMI.CrossRulerWidget(stackHelper.slice.mesh, controls, {
                    lps2IJK: stack.lps2IJK,
                    pixelSpacing: stack.frame[stackHelper.index].pixelSpacing,
                    ultrasoundRegions: stack.frame[stackHelper.index].ultrasoundRegions,
                });
                break;
            case 'BiRuler':
                widget = new AMI.BiRulerWidget(stackHelper.slice.mesh, controls, {
                    lps2IJK: stack.lps2IJK,
                    pixelSpacing: stack.frame[stackHelper.index].pixelSpacing,
                    ultrasoundRegions: stack.frame[stackHelper.index].ultrasoundRegions,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Angle':
                widget = new AMI.AngleWidget(stackHelper.slice.mesh, controls, {
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Rectangle':
                widget = new AMI.RectangleWidget(stackHelper.slice.mesh, controls, {
                    frameIndex: stackHelper.index,
                    stack: stack,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Ellipse':
                widget = new AMI.EllipseWidget(stackHelper.slice.mesh, controls, {
                    frameIndex: stackHelper.index,
                    stack: stack,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Polygon':
                widget = new AMI.PolygonWidget(stackHelper.slice.mesh, controls, {
                    frameIndex: stackHelper.index,
                    stack: stack,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Freehand':
                widget = new AMI.FreehandWidget(stackHelper.slice.mesh, controls, {
                    frameIndex: stackHelper.index,
                    stack: stack,
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Annotation':
                widget = new AMI.AnnotationWidget(stackHelper.slice.mesh, controls, {
                    worldPosition: intersects[0].point,
                });
                break;
            case 'Handle':
            default:
                widget = new AMI.HandleWidget(stackHelper.slice.mesh, controls, {
                    worldPosition: intersects[0].point,
                });
        }
        //widget._dom.parentNode.removeChild(widget._dom);
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }
        function rgbToHex(r, g, b) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }
        widget._colors.default = rgbToHex(
            segmentationGUIObjects.color[0],
            segmentationGUIObjects.color[1],
            segmentationGUIObjects.color[2]);
        widget.updateColor();
        widgets.push(widget);
        //refObj.scene.add(widget);
        //r1.scene.add(widget);
        //r2.scene.add(widget);
        //r3.scene.add(widget);
        vr.scene.add(widget);
        r0.scene.add(widget);
        allModified();

    }
    function onMouseMove(event) {
        let cursor = 'default';
        for (let widget of widgets) {
            widget.onMove(event);
            if (widget.hovered) {
                cursor = 'pointer';
            }
        }

        r0.modified = true;
    }
    function onMouseUp(event) {
        for (let widget of widgets) {
            if (widget.active) {
                widget.onEnd();
                return;
            }
        }
    }
    let segmentationFolder = gui.addFolder('Segmentation');
    segmentationFolder.add(segmentationGUIObjects, 'algorithm', segmentationGUIObjects.algorithms);
    segmentationFolder.add(segmentationGUIObjects, 'segmentation');
    segmentationFolder.add(segmentationGUIObjects, 'widgetType', widgetsAvailable)
        .onChange(function () {
            if (segmentationGUIObjects.widgetType === 'None') {
                r1.domElement.removeEventListener('mousedown', onMouseDown);
                r1.domElement.removeEventListener('mousemove', onMouseMove);
                r1.domElement.removeEventListener('mouseup', onMouseUp);
                r2.domElement.removeEventListener('mousedown', onMouseDown);
                r2.domElement.removeEventListener('mousemove', onMouseMove);
                r2.domElement.removeEventListener('mouseup', onMouseUp);
                r3.domElement.removeEventListener('mousedown', onMouseDown);
                r3.domElement.removeEventListener('mousemove', onMouseMove);
                r3.domElement.removeEventListener('mouseup', onMouseUp);
            } else {
                r1.domElement.addEventListener('mousedown', onMouseDown);
                r1.domElement.addEventListener('mousemove', onMouseMove);
                r1.domElement.addEventListener('mouseup', onMouseUp);
                r2.domElement.addEventListener('mousedown', onMouseDown);
                r2.domElement.addEventListener('mousemove', onMouseMove);
                r2.domElement.addEventListener('mouseup', onMouseUp);
                r3.domElement.addEventListener('mousedown', onMouseDown);
                r3.domElement.addEventListener('mousemove', onMouseMove);
                r3.domElement.addEventListener('mouseup', onMouseUp);
            }
        });
    segmentationFolder.add(segmentationGUIObjects, 'id')
        .listen();
    dropdown = segmentationFolder.add(segmentationGUIObjects, 'segment', segmentationGUIObjects.segmentsLabel)
        .onChange(function () {
            var i;
            for (var key in segmentationGUIObjects.segments) {
                if (segmentationGUIObjects.segments[key].label === segmentationGUIObjects.segment) {
                    i = key;
                    break;
                }
            }
            segmentationGUIObjects.id = i.toString();
            segmentationGUIObjects.color = segmentationGUIObjects.segments[i].color.slice();
            segmentationGUIObjects.opacity = segmentationGUIObjects.segments[i].opacity;
        });
    segmentationFolder.addColor(segmentationGUIObjects, 'color')
        .listen()
        .onChange(function (value) {
            segmentationGUIObjects.segments[segmentationGUIObjects.id].color = value;

            segmentHelper.segmentLUT.segmentation = segmentationGUIObjects.segments;

            r1.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            r2.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            r3.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            vr.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        });
    segmentationFolder.add(segmentationGUIObjects, 'opacity', 0, 1)
        .step(0.01)
        .listen()
        .onChange(function (value) {
            segmentationGUIObjects.segments[segmentationGUIObjects.id].opacity = value;

            segmentHelper.segmentLUT.segmentation = segmentationGUIObjects.segments;

            r1.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            r2.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            r3.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
            vr.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
        });
    segmentationFolder.add(segmentationGUIObjects, 'opacityAll', 0, 1)
        .step(0.01)
        .listen()
        .onChange(function (value) {
            r1.uniformsLayerMix.uOpacity1.value = value;
            r2.uniformsLayerMix.uOpacity1.value = value;
            r3.uniformsLayerMix.uOpacity1.value = value;
            vr.vrHelperSeg.uniforms.uAlphaCorrection.value = value;
            //vr.vrHelperSeg.mesh.material.uniforms.uAlphaCorrection.value = value;
            allModified();
        });
    segmentationFolder.add(segmentationGUIObjects, 'segmentTarget');
    segmentationFolder.add(segmentationGUIObjects, 'addSegment');
    segmentationFolder.add(segmentationGUIObjects, 'removeSegment');
};

updateDropdown = function (target, list) {
    innerHTMLStr = "";
    for (var i = 0; i < list.length; i++) {
        var str = "<option value='" + list[i] + "'>" + list[i] + "</option>";
        innerHTMLStr += str;
    }

    if (innerHTMLStr != "") target.domElement.children[0].innerHTML = innerHTMLStr;
};