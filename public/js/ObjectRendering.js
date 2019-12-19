

initRendererVR = function (renderObj) {
    renderObj.scene = new THREE.Scene();
};
initRenderer3D = function (renderObj) {
    // renderer
    renderObj.domElement = document.getElementById(renderObj.domId);
    renderObj.renderer = new THREE.WebGLRenderer({
        antialias: true,
        //antialias: false
    });
    renderObj.renderer.setSize(renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);
    renderObj.renderer.setClearColor(renderObj.color, 1);
    //renderObj.renderer.setClearColor(renderObj.color, 0);
    renderObj.renderer.domElement.id = renderObj.targetID;
    renderObj.domElement.appendChild(renderObj.renderer.domElement);

    // camera
    renderObj.camera = new THREE.PerspectiveCamera(
        45,
        renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
        0.1,
        100000
    );
    renderObj.camera.position.x = 250;
    renderObj.camera.position.y = 250;
    renderObj.camera.position.z = 250;

    // controls
    renderObj.controls = new AMI.TrackballControl(renderObj.camera, renderObj.domElement);
    renderObj.controls.rotateSpeed = 5.5;
    renderObj.controls.zoomSpeed = 1.2;
    renderObj.controls.panSpeed = 0.8;
    renderObj.controls.staticMoving = true;
    renderObj.controls.dynamicDampingFactor = 0.3;
    renderObj.controls.addEventListener('change', () => {
        r0.modified = true;
    });

    // scene
    renderObj.scene = new THREE.Scene();
    //renderObj.scene.background = new THREE.Color('red');

    // light
    renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
    renderObj.light.position.copy(renderObj.camera.position);
    renderObj.scene.add(renderObj.light);
};
initRenderer2D = function (rendererObj) {
    // renderer
    rendererObj.domElement = document.getElementById(rendererObj.domId);
    rendererObj.renderer = new THREE.WebGLRenderer({
        antialias: true,
        //antialias: false
    });
    rendererObj.renderer.autoClear = false;
    rendererObj.renderer.localClippingEnabled = true;
    rendererObj.renderer.setSize(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight
    );
    rendererObj.renderer.setClearColor(0x121212, 1);
    //rendererObj.renderer.setClearColor(0x121212, 0);
    rendererObj.renderer.domElement.id = rendererObj.targetID;
    rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

    // camera
    rendererObj.camera = new AMI.OrthographicCamera(
        rendererObj.domElement.clientWidth / -2,
        rendererObj.domElement.clientWidth / 2,
        rendererObj.domElement.clientHeight / 2,
        rendererObj.domElement.clientHeight / -2,
        1,
        3000
    );

    // controls
    rendererObj.controls = new AMI.TrackballOrthoControl(rendererObj.camera, rendererObj.domElement);
    rendererObj.controls.staticMoving = true;
    rendererObj.controls.noRotate = true;
    rendererObj.controls.noPan = true;
    rendererObj.camera.controls = rendererObj.controls;
    rendererObj.controls.addEventListener('change', () => {
        r1.modified = true;
        r2.modified = true;
        r3.modified = true;
    });

    offsetsSet(rendererObj);

    // scene
    rendererObj.scene = new THREE.Scene();
    //rendererObj.scene.background = new THREE.Color('red');
    //rendererObj.scene.background = new THREE.Color(0x212121);
    rendererObj.stackScene = new THREE.Scene();
    //rendererObj.stackScene.background = new THREE.Color('blue');
    //rendererObj.stackScene.background = new THREE.Color('black');
    rendererObj.stackScene.background = new THREE.Color(0x212121);
    rendererObj.segmentScene = new THREE.Scene();
    //rendererObj.segmentScene.background = new THREE.Color('green');
    //rendererObj.stackScene.background = new THREE.Color('black');
    rendererObj.segmentScene.background = new THREE.Color(0x212121);

    rendererObj.stackTextureTarget = new THREE.WebGLRenderTarget(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight,
        {
            //minFilter: THREE.LinearFilter,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        });
    rendererObj.segmentTextureTarget = new THREE.WebGLRenderTarget(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight,
        {
            //minFilter: THREE.LinearFilter,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        });
};

initHelpersVolumeRendering = function (rendererObj, stack) {
    rendererObj.vrHelper = new AMI.VolumeRenderingHelper(stack);
    rendererObj.scene.add(rendererObj.vrHelper);

    lut = new AMI.LutHelper('my-lut-canvases');
    lut.luts = AMI.LutHelper.presetLuts();
    lut.lutsO = AMI.LutHelper.presetLutsO();
    // update related uniforms
    rendererObj.vrHelper.uniforms.uTextureLUT.value = lut.texture;
    rendererObj.vrHelper.uniforms.uLut.value = 1;
};
initHelpersStack = function (rendererObj, stack) {
    rendererObj.stackHelper = new AMI.StackHelper(stack);
    rendererObj.stackHelper.bbox.visible = false;
    rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
    rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
    rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;

    rendererObj.stackHelper.slice.lut = lut.lut;
    rendererObj.stackHelper.slice.lutTexture = lut.texture;


    // set camera
    let worldbb = stack.worldBoundingBox();
    let lpsDims = new THREE.Vector3(
        (worldbb[1] - worldbb[0]) / 2,
        (worldbb[3] - worldbb[2]) / 2,
        (worldbb[5] - worldbb[4]) / 2
    );

    // box: {halfDimensions, center}
    let box = {
        center: stack.worldCenter().clone(),
        halfDimensions: new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
    };

    // init and zoom
    let canvas = {
        width: rendererObj.domElement.clientWidth,
        height: rendererObj.domElement.clientHeight,
    };

    rendererObj.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    rendererObj.camera.box = box;
    rendererObj.camera.canvas = canvas;
    rendererObj.camera.orientation = rendererObj.sliceOrientation;
    rendererObj.camera.update();
    rendererObj.camera.fitBox(2, 1);

    rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
    rendererObj.stackHelper.index = Math.floor(rendererObj.stackHelper.orientationMaxIndex / 2);
    //rendererObj.stackHelper.index = 0;
    rendererObj.stackScene.add(rendererObj.stackHelper);
    //rendererObj.scene.add(rendererObj.stackHelper);
    //rendererObj.scene.add(rendererObj.stackScene);
};

initHelpersSegmentVolumeRendering = function (rendererObj, segment) {
    rendererObj.vrHelperSeg = new AMI.VolumeRenderingHelper(segment);
    rendererObj.scene.add(rendererObj.vrHelperSeg);
    //rendererObj.vrHelperSeg.interpolation = 0;
    //rendererObj.vrHelperSeg.interpolation = 2;
    rendererObj.vrHelperSeg.interpolation = 3;

    if (segment._segmentationSegments) {
        for (var i = 0; i < segment._segmentationSegments.length; i++) {
            var seg = segment._segmentationSegments[i];
            var color = d3.lab(seg.recommendedDisplayCIELab[0], seg.recommendedDisplayCIELab[1], seg.recommendedDisplayCIELab[2]).rgb();
            segmentationGUIObjects.segments[seg.segmentNumber] = { color: [color.r, color.g, color.b], opacity: 1, label: seg.segmentLabel };
        }
        segmentationGUIObjects.segmentsLabel = [];
        for (var key in segmentationGUIObjects.segments) {
            segmentationGUIObjects.segmentsLabel.push(segmentationGUIObjects.segments[key].label);
        }
    }
    $('#my-seg-container').css('display', 'flex');
    segmentHelper.segmentLUT = new AMI.SegmentationLutHelper('my-seg-canvases', segmentationGUIObjects.segments);

    rendererObj.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
    rendererObj.vrHelperSeg.uniforms.uLutSegmentation.value = 1;
    rendererObj.vrHelperSeg.uniforms.uAlphaCorrection.value = 1;
};
initHelpersSegmentStack = function (rendererObj, segment) {
    if (!segmentHelper.segmentTexture.length) {
        segmentHelper.segmentTexture = [];
        for (var m = 0; m < segment._rawData.length; m++) {
            var tex = new THREE.DataTexture(
                segment.rawData[m],
                segment.textureSize,
                segment.textureSize,
                segment.textureType,
                THREE.UnsignedByteType,
                THREE.UVMapping,
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.NearestFilter,
                THREE.NearestFilter,
            );
            tex.needsUpdate = true;
            tex.flipY = true;
            segmentHelper.segmentTexture.push(tex);
        }
    }
    rendererObj.segmentTexture = segmentHelper.segmentTexture;
    /*rendererObj.segmentTexture = [];
    for (var m = 0; m < segment._rawData.length; m++) {
        var tex = new THREE.DataTexture(
            segment.rawData[m],
            segment.textureSize,
            segment.textureSize,
            segment.textureType,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter,
            //rendererObj.renderer.getMaxAnisotropy()
        );
        tex.needsUpdate = true;
        tex.flipY = true;
        rendererObj.segmentTexture.push(tex);
    }*/
    rendererObj.segmentUniform = AMI.DataUniformShader.uniforms();
    rendererObj.segmentUniform.uTextureSize.value = segment.textureSize;
    rendererObj.segmentUniform.uDataDimensions.value = [segment.dimensionsIJK.x, segment.dimensionsIJK.y, segment.dimensionsIJK.z];
    rendererObj.segmentUniform.uWorldToData.value = segment.lps2IJK;
    rendererObj.segmentUniform.uNumberOfChannels.value = segment.numberOfChannels;
    rendererObj.segmentUniform.uPixelType.value = segment.pixelType;
    rendererObj.segmentUniform.uBitsAllocated.value = segment.bitsAllocated;
    rendererObj.segmentUniform.uPackedPerPixel.value = segment.packedPerPixel;    //new
    rendererObj.segmentUniform.uSpacing.value = rendererObj.stackHelper.slice.spacing;            //new
    rendererObj.segmentUniform.uThickness.value = rendererObj.stackHelper.slice.thickness;        //new
    rendererObj.segmentUniform.uThicknessMethod.value = rendererObj.stackHelper.slice.thickness;  //new

    rendererObj.segmentUniform.uTextureContainer.value = rendererObj.segmentTexture;

    rendererObj.segmentUniform.uRescaleSlopeIntercept.value = [segment.rescaleSlope, segment.rescaleIntercept];
    rendererObj.segmentUniform.uWindowCenterWidth.value = [segment.windowCenter, segment.windowWidth];
    rendererObj.segmentUniform.uOpacity.value = 1;
    rendererObj.segmentUniform.uLowerUpperThreshold.value = segment.minMax;
    rendererObj.segmentUniform.uInvert.value = 0;
    rendererObj.segmentUniform.uInterpolation.value = 0;
    
    rendererObj.segmentUniform.uCanvasHeight.value = rendererObj.domElement.clientHeight;
    rendererObj.segmentUniform.uCanvasWidth.value = rendererObj.domElement.clientWidth;

    rendererObj.segmentUniform.uLutSegmentation.value = 1;
    rendererObj.segmentUniform.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
    //rendererObj.segmentUniform.uLut.value = 1;
    //rendererObj.segmentUniform.uTextureLUT.value = segmentLUT.texture;


    // generate shaders on-demand!
    var fs = new AMI.DataFragmentShader(rendererObj.segmentUniform);
    var vs = new AMI.DataVertexShader();
    rendererObj.segmentMaterial = new THREE.ShaderMaterial(
        {
            side: THREE.DoubleSide,
            uniforms: rendererObj.segmentUniform,
            vertexShader: vs.compute(),
            fragmentShader: fs.compute(),
            //transparent: true,
        });


    // add mesh in this scene with right shaders...
    rendererObj.segmentMesh = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.segmentMaterial);
    // go the LPS space
    rendererObj.segmentMesh.applyMatrix(stack._ijk2LPS);
    rendererObj.segmentScene.add(rendererObj.segmentMesh);

    //rendererObj.scene.add(rendererObj.segmentScene);

    rendererObj.scene.add(rendererObj.stackHelper.border);

    /*************************/
    
    // Create the Mix layer
    rendererObj.uniformsLayerMix = AMI.LayerUniformShader.uniforms();
    rendererObj.uniformsLayerMix.uTextureBackTest0.value = rendererObj.stackTextureTarget.texture;
    rendererObj.uniformsLayerMix.uTextureBackTest1.value = rendererObj.segmentTextureTarget.texture;

    let fls = new AMI.LayerFragmentShader(rendererObj.uniformsLayerMix);
    let vls = new AMI.LayerVertexShader();
    rendererObj.materialLayerMix = new THREE.ShaderMaterial(
        {
            side: THREE.DoubleSide,
            uniforms: rendererObj.uniformsLayerMix,
            vertexShader: vls.compute(),
            fragmentShader: fls.compute(),
            //transparent: true,
        });

    // add mesh in this scene with right shaders...
    rendererObj.meshLayerMix = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.materialLayerMix);
    // go the LPS space
    rendererObj.meshLayerMix.applyMatrix(stack._ijk2LPS);
    rendererObj.scene.add(rendererObj.meshLayerMix);

};

updateSegmentLayer = function (rendererObj) {
    if (rendererObj.segmentMesh) {
        rendererObj.segmentMesh.geometry.dispose();
        rendererObj.segmentMesh.geometry = rendererObj.stackHelper.slice.geometry;
        rendererObj.segmentMesh.geometry.verticesNeedUpdate = true;
    }
};
updateMixLayer = function (rendererObj) {
    if (rendererObj.meshLayerMix) {
        rendererObj.scene.remove(rendererObj.meshLayerMix);
        rendererObj.meshLayerMix.material.dispose();
        rendererObj.meshLayerMix.material = null;
        rendererObj.meshLayerMix.geometry.dispose();
        rendererObj.meshLayerMix.geometry = null;

        rendererObj.meshLayerMix = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.materialLayerMix);
        rendererObj.meshLayerMix.applyMatrix(rendererObj.stackHelper.stack._ijk2LPS);

        rendererObj.scene.add(rendererObj.meshLayerMix);
    }
};

updateSliceMaterial = function (rendererObj) { //segment and stack change
    rendererObj.stackHelper.slice._material.dispose();
    rendererObj.stackHelper.slice._material = null;
    rendererObj.stackHelper.slice._update();
};
updateSegmentMaterial = function (rendererObj) { //segment and stack change
    rendererObj.segmentScene.remove(rendererObj.segmentMesh);
    rendererObj.segmentMesh.material.dispose();
    rendererObj.segmentMesh.material = null;
    rendererObj.segmentMesh.geometry.dispose();
    rendererObj.segmentMesh.geometry = null;
    
    /*rendererObj.segmentTexture = [];
    for (var m = 0; m < segment._rawData.length; m++) {
        var tex = new THREE.DataTexture(
            segment.rawData[m],
            segment.textureSize,
            segment.textureSize,
            segment.textureType,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter);
        tex.needsUpdate = true;
        tex.flipY = true;
        rendererObj.segmentTexture.push(tex);
    }
    rendererObj.segmentUniform.uTextureContainer.value = rendererObj.segmentTexture;*/
    if (segmentHelper.segmentTexture === rendererObj.segmentTexture) {
        segmentHelper.segmentTexture = [];
        for (var m = 0; m < segment._rawData.length; m++) {
            var tex = new THREE.DataTexture(
                segment.rawData[m],
                segment.textureSize,
                segment.textureSize,
                segment.textureType,
                THREE.UnsignedByteType,
                THREE.UVMapping,
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.NearestFilter,
                THREE.NearestFilter,
                //segmentHelper.renderer.getMaxAnisotropy()
            );
            tex.needsUpdate = true;
            tex.flipY = true;
            segmentHelper.segmentTexture.push(tex);
        }
    }
    rendererObj.segmentTexture = segmentHelper.segmentTexture;

    rendererObj.segmentUniform.uTextureContainer.value = rendererObj.segmentTexture;

    var fs = new AMI.DataFragmentShader(rendererObj.segmentUniform);
    var vs = new AMI.DataVertexShader();
    rendererObj.segmentMaterial = new THREE.ShaderMaterial(
        {
            side: THREE.DoubleSide,
            uniforms: rendererObj.segmentUniform,
            vertexShader: vs.compute(),
            fragmentShader: fs.compute(),
            //transparent: true,
        });
    
    rendererObj.segmentMesh = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.segmentMaterial);
    rendererObj.segmentMesh.applyMatrix(rendererObj.stackHelper.stack._ijk2LPS);
    rendererObj.segmentMesh.visible = true;
    rendererObj.segmentScene.add(rendererObj.segmentMesh);
};
updateVolumeMesh = function (rendererObj) {    //segment or stack change
    if (rendererObj.vrHelper._mesh) {
        rendererObj.vrHelper.remove(rendererObj.vrHelper._mesh);
        rendererObj.vrHelper._mesh.geometry.dispose();
        rendererObj.vrHelper._mesh.geometry = null;
        rendererObj.vrHelper._material.dispose();
        rendererObj.vrHelper._material = null;
        rendererObj.vrHelper._mesh = null;
    }
    rendererObj.vrHelper._create();
};
updateSegmentVolumeMesh = function (rendererObj) {
    if (rendererObj.vrHelperSeg._mesh) {
        rendererObj.vrHelperSeg.remove(rendererObj.vrHelperSeg._mesh);
        rendererObj.vrHelperSeg._mesh.geometry.dispose();
        rendererObj.vrHelperSeg._mesh.geometry = null;
        rendererObj.vrHelperSeg._material.dispose();
        rendererObj.vrHelperSeg._material = null;
        rendererObj.vrHelperSeg._mesh = null;
    }
    rendererObj.vrHelperSeg._create();

    rendererObj.vrHelperSeg.uniforms.uTextureLUTSegmentation.value = segmentHelper.segmentLUT.texture;
    rendererObj.vrHelperSeg.uniforms.uLutSegmentation.value = 1;
    rendererObj.vrHelperSeg.uniforms.uAlphaCorrection.value = 1;
};