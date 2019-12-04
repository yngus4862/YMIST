
stack = null;
segment = null;

segmentHelper = {
    segmentTexture: [],
    segmentUniform: null,
    segmentMaterial: null,
    segmentLUT: null,
};
// volume rendering
vr = {
    algorithm: 'ray marching',
    lut: 'random',
    opacity: 'random',
    steps: 128,
    alphaCorrection: 0.5,
    frequence: 0,
    amplitude: 0,
    interpolation: 1,
    volumeToggle: false,

    scene: null,
    vrHelper: null,
    vrHelperSeg: null,

    modified: false,
    downsizing: false
};
// 3d renderer
r0 = {
    domId: 'r0',
    domElement: null,
    renderer: null,
    color: 0x212121,
    targetID: 0,
    camera: null,
    controls: null,
    light: null,

    scene: null,

    modified: false
};
// 2d axial renderer
r1 = {
    domId: 'r1',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'axial',
    sliceColor: 0xff1744,
    targetID: 1,
    camera: null,
    controls: null,
    light: null,

    offsets: null,

    scene: null,
    stackScene: null,
    stackHelper: null,
    stackTextureTarget: null,
    segmentTextureTarget: null,
    localizerScene: null,
    localizerHelper: null,

    segmentTexture: [],
    segmentUniform: null,
    segmentMaterial: null,
    segmentMesh: null,
    segmentScene: null,

    uniformsLayerMix: null,
    materialLayerMix: null,
    meshLayerMix: null,

    modified: false,

    rotate: function () {
        this.camera.rotate();
        this.camera.fitBox(2, 1);
        this.modified = true;
    }
};
// 2d sagittal renderer
r2 = {
    domId: 'r2',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'sagittal',
    sliceColor: 0xffea00,
    targetID: 2,
    camera: null,
    controls: null,
    light: null,

    offsets: null,

    scene: null,
    stackScene: null,
    stackHelper: null,
    StackTextureTarget: null,
    SegmentTextureTarget: null,
    localizerScene: null,
    localizerHelper: null,

    segmentTexture: [],
    segmentUniform: null,
    segmentMaterial: null,
    segmentMesh: null,
    segmentScene: null,

    uniformsLayerMix: null,
    materialLayerMix: null,
    meshLayerMix: null,

    modified: false,

    rotate: function () {
        this.camera.rotate();
        this.camera.fitBox(2, 1);
        this.modified = true;
    }
};
// 2d coronal renderer
r3 = {
    domId: 'r3',
    domElement: null,
    renderer: null,
    color: 0x121212,
    sliceOrientation: 'coronal',
    sliceColor: 0x76ff03,
    targetID: 3,
    camera: null,
    controls: null,
    light: null,

    offsets: null,

    scene: null,
    stackScene: null,
    stackHelper: null,
    StackTextureTarget: null,
    SegmentTextureTarget: null,
    localizerScene: null,
    localizerHelper: null,

    segmentTexture: [],
    segmentUniform: null,
    segmentMaterial: null,
    segmentMesh: null,
    segmentScene: null,

    uniformsLayerMix: null,
    materialLayerMix: null,
    meshLayerMix: null,

    modified: false,

    rotate: function () {
        this.camera.rotate();
        this.camera.fitBox(2, 1);
        this.modified = true;
    }
};

volumeGUISetting = function () {
    function onStart(event) {
        if (vr.vrHelper && vr.vrHelper.uniforms && !wheel) {
            r0.renderer.setPixelRatio(0.1 * window.devicePixelRatio);
            r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
            vr.modified = true;
            vr.downsizing = true;
        }
    }
    function onEnd(event) {
        if (vr.vrHelper && vr.vrHelper.uniforms && !wheel) {
            r0.renderer.setPixelRatio(0.5 * window.devicePixelRatio);
            r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
            vr.modified = true;

            setTimeout(function () {
                r0.renderer.setPixelRatio(window.devicePixelRatio);
                r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
                vr.modified = true;
                vr.downsizing = false;
            }, 100);
        }
    }
    function onWheel(event) {
        if (!wheel) {
            r0.renderer.setPixelRatio(0.1 * window.devicePixelRatio);
            r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
            wheel = Date.now();
        }
        if (Date.now() - wheel < 300) {
            clearTimeout(wheelTO);
            wheelTO = setTimeout(function () {
                r0.renderer.setPixelRatio(0.5 * window.devicePixelRatio);
                r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
                vr.modified = true;

                setTimeout(function () {
                    r0.renderer.setPixelRatio(window.devicePixelRatio);
                    r0.renderer.setSize(r0.domElement.offsetWidth, r0.domElement.offsetHeight);
                    wheel = null;
                    vr.modified = true;
                    vr.downsizing = false;
                }, 100);
            }, 300);
        }
        vr.modified = true;
        vr.downsizing = true;
    }
    let volumeFolder = gui.addFolder('Volume');
    let volumeToggleUpdate = volumeFolder.add(vr, 'volumeToggle');
    volumeToggleUpdate.onChange(function () {
        if (vr.volumeToggle) {
            r0.controls.addEventListener('start', onStart);
            r0.controls.addEventListener('end', onEnd);
            r0.renderer.domElement.addEventListener('wheel', onWheel);
            vr.modified = true;
        } else {
            r0.controls.removeEventListener('start', onStart);
            r0.controls.removeEventListener('end', onEnd);
            r0.renderer.domElement.removeEventListener('wheel', onWheel);
            r0.modified = true;
        }
    });

    let algorithmUpdate = volumeFolder.add(vr, 'algorithm', ['ray marching', 'mip']);
    algorithmUpdate.onChange(function (value) {
        vr.vrHelper.algorithm = value === 'mip' ? 1 : 0;
        vr.modified = true;
    });
    let lutUpdate = volumeFolder.add(vr, 'lut', lut.lutsAvailable());
    lutUpdate.onChange(function (value) {
        lut.lut = value;
        vr.vrHelper.uniforms.uTextureLUT.value.dispose();
        vr.vrHelper.uniforms.uTextureLUT.value = lut.texture;
        r1.stackHelper.slice.lut = lut.lut;
        r1.stackHelper.slice.lutTexture = lut.texture;
        r2.stackHelper.slice.lut = lut.lut;
        r2.stackHelper.slice.lutTexture = lut.texture;
        r3.stackHelper.slice.lut = lut.lut;
        r3.stackHelper.slice.lutTexture = lut.texture;
        allModified();
    });
    let opacityUpdate = volumeFolder.add(vr, 'opacity', lut.lutsAvailable('opacity'));
    opacityUpdate.onChange(function (value) {
        lut.lutO = value;
        vr.vrHelper.uniforms.uTextureLUT.value.dispose();
        vr.vrHelper.uniforms.uTextureLUT.value = lut.texture;
        r1.stackHelper.slice._uniforms.uTextureLUT.value.dispose();
        r1.stackHelper.slice._uniforms.uTextureLUT.value = lut.texture;
        r2.stackHelper.slice._uniforms.uTextureLUT.value.dispose();
        r2.stackHelper.slice._uniforms.uTextureLUT.value = lut.texture;
        r3.stackHelper.slice._uniforms.uTextureLUT.value.dispose();
        r3.stackHelper.slice._uniforms.uTextureLUT.value = lut.texture;
        allModified();
    });
    volumeFolder
        .add(vr.vrHelper, 'windowWidth', 1, vr.vrHelper.stack.minMax[1] - vr.vrHelper.stack.minMax[0])
        .step(1)
        .listen()
        .onChange(function () {
            if (r1.stackHelper.slice.intensityAuto === false) {
                r1.stackHelper.slice.updateIntensitySetting('windowWidth');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r2.stackHelper.slice.updateIntensitySetting('windowWidth');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowWidth');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
            }
            allModified();
        });
    volumeFolder
        .add(vr.vrHelper, 'windowCenter', vr.vrHelper.stack.minMax[0], vr.vrHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            if (r1.stackHelper.slice.intensityAuto === false) {
                r1.stackHelper.slice.updateIntensitySetting('windowWidth');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r2.stackHelper.slice.updateIntensitySetting('windowCenter');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowCenter');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
            }
            allModified();
        });
    let stepsUpdate = volumeFolder.add(vr.vrHelper, 'steps', 0, 512).step(1);
    stepsUpdate.onChange(function (value) {
        if (vr.vrHelper.uniforms) {
            vr.vrHelper.uniforms.uSteps.value = value;
            vr.modified = true;
        }
    });
    let alphaCorrrectionUpdate = volumeFolder.add(vr, 'alphaCorrection', 0, 1).step(0.01);
    alphaCorrrectionUpdate.onChange(function (value) {
        if (vr.vrHelper.uniforms) {
            vr.vrHelper.uniforms.uAlphaCorrection.value = value;
            vr.modified = true;
        }
    });
    let interpolationUpdate = volumeFolder.add(vr.vrHelper, 'interpolation', 0, 1).step(1);
    interpolationUpdate.onChange(function (value) {
        if (vr.vrHelper.uniforms) {
            vr.modified = true;
        }
    });
    let shadingUpdate = volumeFolder.add(vr.vrHelper, 'shading', 0, 1).step(1);
    shadingUpdate.onChange(function (value) {
        if (vr.vrHelper.uniforms) {
            r0.modified = true;
        }
    });
    let shininessUpdate = volumeFolder.add(vr.vrHelper, 'shininess', 0, 20).step(0.1);
    shininessUpdate.onChange(function (value) {
        if (vr.vrHelper.uniforms) {
            vr.modified = true;
        }
    });
};

stackGUISetting = function () {
    let stackFolder1 = gui.addFolder('Axial (Red)');
    redChanged = stackFolder1
        .add(r1.stackHelper, 'index', 0, r1.stackHelper.orientationMaxIndex)
        .step(1)
        .listen()
        .onChange(onRedChanged);
    stackFolder1
        .add(r1.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen()
        .onChange(function () {
            r0.modified = true;
            r1.modified = true;
        });
    stackFolder1
        .add(r1.stackHelper.slice, 'windowWidth', 1, r1.stackHelper.stack.minMax[1] - r1.stackHelper.stack.minMax[0])
        .step(1)
        .listen()
        .onChange(function () {
            if (r1.stackHelper.slice.intensityAuto === false) {
                r1.stackHelper.stack.windowWidth = r1.stackHelper.slice.windowWidth;
                r2.stackHelper.slice.updateIntensitySetting('windowWidth');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowWidth');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowWidth = r1.stackHelper.slice.windowWidth;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder1
        .add(r1.stackHelper.slice, 'windowCenter', r1.stackHelper.stack.minMax[0], r1.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            if (r1.stackHelper.slice.intensityAuto === false) {
                r1.stackHelper.stack.windowCenter = r1.stackHelper.slice.windowCenter;
                r2.stackHelper.slice.updateIntensitySetting('windowCenter');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowCenter');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowCenter = r1.stackHelper.slice.windowCenter;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder1
        .add(r1.stackHelper.slice, 'lowerThreshold', r1.stackHelper.stack.minMax[0], r1.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r2.stackHelper.slice.lowerThreshold = r1.stackHelper.slice.lowerThreshold;
            r3.stackHelper.slice.lowerThreshold = r1.stackHelper.slice.lowerThreshold;
            stackModified();
        });
    stackFolder1
        .add(r1.stackHelper.slice, 'upperThreshold', r1.stackHelper.stack.minMax[0], r1.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r2.stackHelper.slice.upperThreshold = r1.stackHelper.slice.upperThreshold;
            r3.stackHelper.slice.upperThreshold = r1.stackHelper.slice.upperThreshold;
            stackModified();
        });
    stackFolder1.add(r1.stackHelper.slice, 'intensityAuto').listen()
        .onChange(function () {
            r2.stackHelper.slice.intensityAuto = r1.stackHelper.slice.intensityAuto;
            r3.stackHelper.slice.intensityAuto = r1.stackHelper.slice.intensityAuto;
            stackModified();
        });
    stackFolder1.add(r1.stackHelper.slice, 'invert')
        .onChange(function () {
            if (r1.stackHelper.slice.intensityAuto === false) {
                r1.stackHelper.stack.invert = r1.stackHelper.slice.invert;
                r2.stackHelper.slice.updateIntensitySetting('invert');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('invert');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
            }
            stackModified();
        });
    stackFolder1.add(r1, 'rotate');

    let stackFolder2 = gui.addFolder('Sagittal (yellow)');
    yellowChanged = stackFolder2
        .add(r2.stackHelper, 'index', 0, r2.stackHelper.orientationMaxIndex)
        .step(1)
        .listen()
        .onChange(onYellowChanged);
    stackFolder2
        .add(r2.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen()
        .onChange(function () {
            r0.modified = true;
            r2.modified = true;
        });
    stackFolder2
        .add(r2.stackHelper.slice, 'windowWidth', 1, r2.stackHelper.stack.minMax[1] - r2.stackHelper.stack.minMax[0])
        .step(1)
        .listen()
        .onChange(function () {
            if (r2.stackHelper.slice.intensityAuto === false) {
                r2.stackHelper.stack.windowWidth = r2.stackHelper.slice.windowWidth;
                r1.stackHelper.slice.updateIntensitySetting('windowWidth');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowWidth');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowWidth = r2.stackHelper.slice.windowWidth;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder2
        .add(r2.stackHelper.slice, 'windowCenter', r2.stackHelper.stack.minMax[0], r2.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            if (r2.stackHelper.slice.intensityAuto === false) {
                r2.stackHelper.stack.windowCenter = r2.stackHelper.slice.windowCenter;
                r1.stackHelper.slice.updateIntensitySetting('windowCenter');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('windowCenter');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowCenter = r2.stackHelper.slice.windowCenter;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder2
        .add(r2.stackHelper.slice, 'lowerThreshold', r2.stackHelper.stack.minMax[0], r2.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r1.stackHelper.slice.lowerThreshold = r2.stackHelper.slice.lowerThreshold;
            r3.stackHelper.slice.lowerThreshold = r2.stackHelper.slice.lowerThreshold;
            stackModified();
        });
    stackFolder2
        .add(r2.stackHelper.slice, 'upperThreshold', r2.stackHelper.stack.minMax[0], r2.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r2.stackHelper.slice.upperThreshold = r2.stackHelper.slice.upperThreshold;
            r3.stackHelper.slice.upperThreshold = r2.stackHelper.slice.upperThreshold;
            stackModified();
        });
    stackFolder2.add(r2.stackHelper.slice, 'intensityAuto').listen()
        .onChange(function () {
            r1.stackHelper.slice.intensityAuto = r2.stackHelper.slice.intensityAuto;
            r3.stackHelper.slice.intensityAuto = r2.stackHelper.slice.intensityAuto;
            stackModified();
        });
    stackFolder2.add(r2.stackHelper.slice, 'invert')
        .onChange(function () {
            if (r2.stackHelper.slice.intensityAuto === false) {
                r2.stackHelper.stack.invert = r2.stackHelper.slice.invert;
                r1.stackHelper.slice.updateIntensitySetting('invert');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r3.stackHelper.slice.updateIntensitySetting('invert');
                r3.stackHelper.slice.updateIntensitySettingsUniforms();
            }
            stackModified();
        });
    stackFolder2.add(r2, 'rotate');

    let stackFolder3 = gui.addFolder('Coronal (green)');
    greenChanged = stackFolder3
        .add(r3.stackHelper, 'index', 0, r3.stackHelper.orientationMaxIndex)
        .step(1)
        .listen()
        .onChange(onGreenChanged);
    stackFolder3
        .add(r3.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen()
        .onChange(function () {
            r0.modified = true;
            r3.modified = true;
        });
    stackFolder3
        .add(r3.stackHelper.slice, 'windowWidth', 1, r3.stackHelper.stack.minMax[1] - r3.stackHelper.stack.minMax[0])
        .step(1)
        .listen()
        .onChange(function () {
            if (r3.stackHelper.slice.intensityAuto === false) {
                r3.stackHelper.stack.windowWidth = r3.stackHelper.slice.windowWidth;
                r1.stackHelper.slice.updateIntensitySetting('windowWidth');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r2.stackHelper.slice.updateIntensitySetting('windowWidth');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowWidth = r3.stackHelper.slice.windowWidth;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder3
        .add(r3.stackHelper.slice, 'windowCenter', r3.stackHelper.stack.minMax[0], r3.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            if (r3.stackHelper.slice.intensityAuto === false) {
                r3.stackHelper.stack.windowCenter = r3.stackHelper.slice.windowCenter;
                r1.stackHelper.slice.updateIntensitySetting('windowCenter');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r2.stackHelper.slice.updateIntensitySetting('windowCenter');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
                vr.vrHelper.windowCenter = r3.stackHelper.slice.windowCenter;
                vr.modified = true;
            }
            stackModified();
        });
    stackFolder3
        .add(r3.stackHelper.slice, 'lowerThreshold', r3.stackHelper.stack.minMax[0], r3.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r1.stackHelper.slice.lowerThreshold = r3.stackHelper.slice.lowerThreshold;
            r2.stackHelper.slice.lowerThreshold = r3.stackHelper.slice.lowerThreshold;
            stackModified();
        });
    stackFolder3
        .add(r3.stackHelper.slice, 'upperThreshold', r3.stackHelper.stack.minMax[0], r3.stackHelper.stack.minMax[1])
        .step(1)
        .listen()
        .onChange(function () {
            r1.stackHelper.slice.upperThreshold = r3.stackHelper.slice.upperThreshold;
            r2.stackHelper.slice.upperThreshold = r3.stackHelper.slice.upperThreshold;
            stackModified();
        });
    stackFolder3.add(r3.stackHelper.slice, 'intensityAuto').listen()
        .onChange(function () {
            r1.stackHelper.slice.intensityAuto = r3.stackHelper.slice.intensityAuto;
            r2.stackHelper.slice.intensityAuto = r3.stackHelper.slice.intensityAuto;
            stackModified();
        });
    stackFolder3.add(r3.stackHelper.slice, 'invert')
        .onChange(function () {
            if (r3.stackHelper.slice.intensityAuto === false) {
                r3.stackHelper.stack.invert = r3.stackHelper.slice.invert;
                r1.stackHelper.slice.updateIntensitySetting('invert');
                r1.stackHelper.slice.updateIntensitySettingsUniforms();
                r2.stackHelper.slice.updateIntensitySetting('invert');
                r2.stackHelper.slice.updateIntensitySettingsUniforms();
            }
            stackModified();
        });
    stackFolder3.add(r3, 'rotate');
};

initHelpersLocalizer = function (rendererObj, stack, referencePlane, localizers) {
    rendererObj.localizerHelper = new AMI.LocalizerHelper(
        stack,
        rendererObj.stackHelper.slice.geometry,
        referencePlane
    );

    for (let i = 0; i < localizers.length; i++) {
        rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
        rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
    }

    rendererObj.localizerHelper.canvasWidth = rendererObj.domElement.clientWidth;
    rendererObj.localizerHelper.canvasHeight = rendererObj.domElement.clientHeight;

    rendererObj.localizerScene = new THREE.Scene();
    rendererObj.localizerScene.add(rendererObj.localizerHelper);
};

updateLocalizer = function (refObj, targetLocalizersHelpers) {
    let refHelper = refObj.stackHelper;
    let localizerHelper = refObj.localizerHelper;
    let plane = refHelper.slice.cartesianEquation();
    localizerHelper.referencePlane = plane;

    // bit of a hack... works fine for this application
    for (let i = 0; i < targetLocalizersHelpers.length; i++) {
        for (let j = 0; j < 3; j++) {
            let targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
            if (
                targetPlane &&
                plane.x.toFixed(6) === targetPlane.x.toFixed(6) &&
                plane.y.toFixed(6) === targetPlane.y.toFixed(6) &&
                plane.z.toFixed(6) === targetPlane.z.toFixed(6)
            ) {
                targetLocalizersHelpers[i]['plane' + (j + 1)] = plane;
            }
        }
    }

    // update the geometry will create a new mesh
    localizerHelper.geometry = refHelper.slice.geometry;
    refObj.modified = true;
};
onRedChanged = function () {
    updateSegmentLayer(r1);
    updateMixLayer(r1);
    updateLocalizer(r1, [r2.localizerHelper, r3.localizerHelper]);
    stackModified();
};
onYellowChanged = function () {
    updateSegmentLayer(r2);
    updateMixLayer(r2);
    updateLocalizer(r2, [r1.localizerHelper, r3.localizerHelper]);
    stackModified();
};
onGreenChanged = function () {
    updateSegmentLayer(r3);
    updateMixLayer(r3);
    updateLocalizer(r3, [r1.localizerHelper, r2.localizerHelper]);
    stackModified();
};