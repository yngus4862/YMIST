stats = null;
ready = false;
wheel = null;   //Date
wheelTO = null; //Timeout
gui = null;

CopyFrame = function (frame) {
    var copyFrame = new AMI.FrameModel();
    copyFrame._bitsAllocated = 8;
    copyFrame._columns = frame._columns;
    copyFrame._rows = frame._rows;
    copyFrame._imageOrientation = frame._imageOrientation.slice();
    copyFrame._imagePosition = frame._imagePosition.slice();
    copyFrame._index = frame._index;
    copyFrame._instanceNumber = frame._instanceNumber;
    copyFrame._minMax = [0, 255];
    copyFrame._pixelData = new Uint8Array(copyFrame._columns * copyFrame._rows);
    copyFrame._pixelRepresentation = frame._pixelRepresentation;
    copyFrame._pixelSpacing = frame._pixelSpacing;
    copyFrame._pixelType = 0;
    copyFrame.rescaleSlope = 1;
    copyFrame.rescaleIntercept = 0;
    copyFrame._sliceThickness = frame._sliceThickness;
    copyFrame._windowCenter = 127;
    copyFrame._windowWidth = 255;
    return copyFrame;
};
CopyStack = function (stack) {
    var copyStack = new AMI.StackModel();
    for (var i = 0; i < stack._frame.length; i++) {
        var frame = stack._frame[i];
        var copyFrame = CopyFrame(frame);
        copyStack._frame.push(copyFrame);
    }

    return copyStack;
};

$(document).ready(function () {
    $('[name="iFile"]').on("change", loadIFiles);
    $('[name="sFile"]').on("change", loadSFiles);
    $('[name="cFile"]').on("change", loadCFiles);

    $("#renderButton").button();
    $("#renderButton").on("click", function (event) {
        parseFiles()
            .then(function (dataSet) {  //[stackSeries, segmentSeries, colorLUT]
                if (dataSet[0]) {
                    let series1 = dataSet[0][0];
                    stack = series1.stack[0];
                    stack.prepare();
                }
                if (dataSet[2].length) {
                    segmentationGUIObjects.segments = dataSet[2][0];
                    segmentationGUIObjects.segment = segmentationGUIObjects.segments[0].label;

                }
                if (dataSet[1]) {
                    let series2 = dataSet[1][0];
                    segment = series2.stack[0];
                    //segment._modality = 'SEG';
                    segment.prepare();
                    segment.pack();
                } else {
                    /*segment = new AMI.StackModel;
                    Object.assign(segment, stack);
                    segment._bitsAllocated = 8;
                    segment.frame = [];
                    for (var i = 0; i < segment._dimensionsIJK.z; i++) {
                        segment.frame[i] = new AMI.FrameModel;
                        Object.assign(segment.frame[i], stack.frame[i]);
                        segment.frame[i]._bitsAllocated = 8;
                        segment.frame[i].pixelType = 0;
                        segment.frame[i].pixelData = new Uint8Array(segment._dimensionsIJK.x * segment._dimensionsIJK.y);
                    }*/
                    segment = CopyStack(stack);

                    segment.prepare();
                }



                $("#viewer").show();
                $("#front").hide();

                init();

                let centerLPS = stack.worldCenter();
                r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
                r0.camera.updateProjectionMatrix();
                r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
                let boxHelper = new AMI.BoundingBoxHelper(stack);
                r0.scene.add(boxHelper);

                initHelpersVolumeRendering(vr, stack);
                initHelpersStack(r1, stack);
                initHelpersStack(r2, stack);
                initHelpersStack(r3, stack);
                if (segment) {
                    initHelpersSegmentVolumeRendering(vr, segment);
                    initHelpersSegmentStack(r1, segment);
                    initHelpersSegmentStack(r2, segment);
                    initHelpersSegmentStack(r3, segment);
                }
                r0.scene.add(r1.scene);
                r0.scene.add(r2.scene);
                r0.scene.add(r3.scene);

                let plane1 = r1.stackHelper.slice.cartesianEquation();
                let plane2 = r2.stackHelper.slice.cartesianEquation();
                let plane3 = r3.stackHelper.slice.cartesianEquation();
                initHelpersLocalizer(r1, stack, plane1, [
                    { plane: plane2, color: new THREE.Color(r2.stackHelper.borderColor) },
                    { plane: plane3, color: new THREE.Color(r3.stackHelper.borderColor) },
                ]);
                initHelpersLocalizer(r2, stack, plane2, [
                    { plane: plane1, color: new THREE.Color(r1.stackHelper.borderColor) },
                    { plane: plane3, color: new THREE.Color(r3.stackHelper.borderColor) },
                ]);
                initHelpersLocalizer(r3, stack, plane3, [
                    { plane: plane1, color: new THREE.Color(r1.stackHelper.borderColor) },
                    { plane: plane2, color: new THREE.Color(r2.stackHelper.borderColor) },
                ]);

                /* gui */
                gui = new dat.GUI({
                    autoPlace: false
                });
                let customContainer = document.getElementById('my-gui-container');
                customContainer.appendChild(gui.domElement);

                volumeGUISetting();
                stackGUISetting();
                segmentationGUISetting();
                imageprocessGUISetting();
                fileGUISetting();

                function onScroll(event) {
                    const id = event.target.domElement.id;
                    let stackHelper = null;
                    var refObj = null;
                    switch (id) {
                        case 'r1':
                            stackHelper = r1.stackHelper;
                            refObj = r1;
                            break;
                        case 'r2':
                            stackHelper = r2.stackHelper;
                            refObj = r2;
                            break;
                        case 'r3':
                            stackHelper = r3.stackHelper;
                            refObj = r3;
                            break;
                    }

                    if (event.delta > 0) {
                        if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
                            return false;
                        }
                        stackHelper.index += 1;
                    } else {
                        if (stackHelper.index <= 0) {
                            return false;
                        }
                        stackHelper.index -= 1;
                    }

                    if (refObj === r1) {
                        onRedChanged();
                    } else if (refObj === r2) {
                        onYellowChanged();
                    } else if (refObj === r3) {
                        onGreenChanged();
                    }
                    //render();
                }
                r1.controls.addEventListener('OnScroll', onScroll);
                r2.controls.addEventListener('OnScroll', onScroll);
                r3.controls.addEventListener('OnScroll', onScroll);

                function windowResize2D(rendererObj) {
                    rendererObj.camera.canvas = {
                        width: rendererObj.domElement.clientWidth,
                        height: rendererObj.domElement.clientHeight,
                    };
                    rendererObj.camera.fitBox(2, 1);
                    rendererObj.renderer.setSize(
                        rendererObj.domElement.clientWidth,
                        rendererObj.domElement.clientHeight
                    );

                    // update info to draw borders properly
                    rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
                    rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;
                    rendererObj.localizerHelper.canvasWidth = rendererObj.domElement.clientWidth;
                    rendererObj.localizerHelper.canvasHeight = rendererObj.domElement.clientHeight;

                    rendererObj.segmentUniform.uCanvasHeight.value = rendererObj.domElement.clientHeight;
                    rendererObj.segmentUniform.uCanvasWidth.value = rendererObj.domElement.clientWidth;

                    offsetsSet(rendererObj);
                }
                function onWindowResize() {
                    // update 3D
                    r0.camera.aspect = r0.domElement.clientWidth / r0.domElement.clientHeight;
                    r0.camera.updateProjectionMatrix();
                    r0.renderer.setSize(r0.domElement.clientWidth, r0.domElement.clientHeight);

                    // update 2d
                    windowResize2D(r1);
                    windowResize2D(r2);
                    windowResize2D(r3);

                    // repaint all widgets
                    for (let widget of widgets) {
                        widget.update();
                    }

                    //render();
                    vr.modified = true;
                    stackModified();
                }
                window.addEventListener('resize', onWindowResize, false);

                //updateSegmentLayer(r1);
                //updateSegmentLayer(r2);
                //updateSegmentLayer(r3);

                ready = true;
                allModified();
            })
            .catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
    });
});

render = function () {
    if (ready) {
        r0.controls.update();
        r1.controls.update();
        r2.controls.update();
        r3.controls.update();

        r0.light.position.copy(r0.camera.position);

        if (r1.modified) {
            r1.renderer.clear();
            // r1
            //r1.renderer.render(r1.scene, r1.camera);
            r1.renderer.setRenderTarget(r1.stackTextureTarget);
            r1.renderer.render(r1.stackScene, r1.camera);
            r1.renderer.setRenderTarget(null);
            //r1.renderer.clear();
            r1.renderer.setRenderTarget(r1.segmentTextureTarget);
            r1.renderer.render(r1.segmentScene, r1.camera);
            r1.renderer.setRenderTarget(null);
            r1.renderer.render(r1.scene, r1.camera);
            // localizer
            r1.renderer.clearDepth();
            r1.renderer.render(r1.localizerScene, r1.camera);
            r1.modified = false;
        }
        if (r2.modified) {
            r2.renderer.clear();
            // r2
            //r2.renderer.render(r2.scene, r2.camera);
            r2.renderer.setRenderTarget(r2.stackTextureTarget);
            r2.renderer.render(r2.stackScene, r2.camera);
            r2.renderer.setRenderTarget(null);
            //r2.renderer.clear();
            r2.renderer.setRenderTarget(r2.segmentTextureTarget);
            r2.renderer.render(r2.segmentScene, r2.camera);
            r2.renderer.setRenderTarget(null);
            r2.renderer.render(r2.scene, r2.camera);
            // localizer
            r2.renderer.clearDepth();
            r2.renderer.render(r2.localizerScene, r2.camera);
            r2.modified = false;
        }
        if (r3.modified) {
            r3.renderer.clear();
            // r3
            //r3.renderer.render(r3.scene, r3.camera);
            r3.renderer.setRenderTarget(r3.stackTextureTarget);
            r3.renderer.render(r3.stackScene, r3.camera);
            r3.renderer.setRenderTarget(null);
            //r3.renderer.clear();
            r3.renderer.setRenderTarget(r3.segmentTextureTarget);
            r3.renderer.render(r3.segmentScene, r3.camera);
            r3.renderer.setRenderTarget(null);
            r3.renderer.render(r3.scene, r3.camera);
            // localizer
            r3.renderer.clearDepth();
            r3.renderer.render(r3.localizerScene, r3.camera);
            r3.modified = false;
        }
        if (vr.volumeToggle) {
            if (vr.modified) {
                r0.renderer.clear();

                r0.renderer.render(vr.scene, r0.camera);
                if (!vr.downsizing) {
                    vr.modified = false;
                }
            }
        } else {
            if (r0.modified) {
                r0.renderer.clear();
                r0.renderer.setRenderTarget(r1.stackTextureTarget);
                r0.renderer.render(r1.stackScene, r0.camera);
                r0.renderer.setRenderTarget(null);
                //r0.renderer.clear();
                r0.renderer.setRenderTarget(r1.segmentTextureTarget);
                r0.renderer.render(r1.segmentScene, r0.camera);
                r0.renderer.setRenderTarget(null);

                //r0.renderer.clear();
                r0.renderer.setRenderTarget(r2.stackTextureTarget);
                r0.renderer.render(r2.stackScene, r0.camera);
                r0.renderer.setRenderTarget(null);
                //r0.renderer.clear();
                r0.renderer.setRenderTarget(r2.segmentTextureTarget);
                r0.renderer.render(r2.segmentScene, r0.camera);
                r0.renderer.setRenderTarget(null);

                //r0.renderer.clear();
                r0.renderer.setRenderTarget(r3.stackTextureTarget);
                r0.renderer.render(r3.stackScene, r0.camera);
                r0.renderer.setRenderTarget(null);
                //r0.renderer.clear();
                r0.renderer.setRenderTarget(r3.segmentTextureTarget);
                r0.renderer.render(r3.segmentScene, r0.camera);
                r0.renderer.setRenderTarget(null);
                
                //r0.renderer.clear();
                r0.renderer.render(r0.scene, r0.camera);
                r0.modified = false;
            }
        }
    }

    //stats.update();
};
init = function () {
    function animate() {
        render();

        requestAnimationFrame(function () {
            animate();
        });
    }

    initRenderer3D(r0);
    initRenderer2D(r1);
    initRenderer2D(r2);
    initRenderer2D(r3);
    initRendererVR(vr);

    // stats
    //stats = new Stats();
    //r0.domElement.appendChild(stats.domElement);

    animate();
    //render();
};