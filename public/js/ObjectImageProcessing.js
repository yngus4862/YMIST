createITKImage = function (stack, index) {
    var dimension = 2;
    var componentType;
    if (stack.pixelType === 0) {
        if (stack._bitsAllocated === 8) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int8;
            } else {
                componentType = itk.IntTypes.UInt8;
            }
        } else if (stack._bitsAllocated === 16) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int16;
            } else {
                componentType = itk.IntTypes.UInt16;
            }
        } else if (stack._bitsAllocated === 32) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int32;
            } else {
                componentType = itk.IntTypes.UInt32;
            }
        } else if (stack._bitsAllocated === 64) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int64;
            } else {
                componentType = itk.IntTypes.UInt64;
            }
        }
    } else if (stack.pixelType === 1) {
        if (stack._bitsAllocated === 32) {
            componentType = itk.FloatTypes.Float32;
        } else if (stack._bitsAllocated === 64) {
            componentType = itk.FloatTypes.Float64;
        }
    }
    var pixelType = itk.PixelTypes.Scalar;
    var components = 1;

    var itkImage = new itk.Image(new itk.ImageType(dimension, componentType, pixelType, components));
    itkImage.data = stack.frame[index].pixelData;
    itkImage.size = [stack._columns, stack._rows];
    return itkImage;
};
createITKImage3D = function (stack, crop) {
    var dimension = 3;
    var componentType;
    var dataContainer;
    if (stack.pixelType === 0) {
        if (stack._bitsAllocated === 8) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int8;
                dataContainer = new Int8Array(stack._columns * stack._rows * stack._numberOfFrames);
            } else {
                componentType = itk.IntTypes.UInt8;
                dataContainer = new Uint8Array(stack._columns * stack._rows * stack._numberOfFrames);
            }
        } else if (stack._bitsAllocated === 16) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int16;
                dataContainer = new Int16Array(stack._columns * stack._rows * stack._numberOfFrames);
            } else {
                componentType = itk.IntTypes.UInt16;
                dataContainer = new Uint16Array(stack._columns * stack._rows * stack._numberOfFrames);
            }
        } else if (stack._bitsAllocated === 32) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int32;
                dataContainer = new Int32Array(stack._columns * stack._rows * stack._numberOfFrames);
            } else {
                componentType = itk.IntTypes.UInt32;
                dataContainer = new Uint32Array(stack._columns * stack._rows * stack._numberOfFrames);
            }
        } else if (stack._bitsAllocated === 64) {
            if (stack.minMax[0] < 0) {
                componentType = itk.IntTypes.Int64;
                dataContainer = new Int64Array(stack._columns * stack._rows * stack._numberOfFrames);
            } else {
                componentType = itk.IntTypes.UInt64;
                dataContainer = new Uint64Array(stack._columns * stack._rows * stack._numberOfFrames);
            }
        }
    } else if (stack.pixelType === 1) {
        if (stack._bitsAllocated === 32) {
            componentType = itk.FloatTypes.Float32;
            dataContainer = new Float32Array(stack._columns * stack._rows * stack._numberOfFrames);
        } else if (stack._bitsAllocated === 64) {
            componentType = itk.FloatTypes.Float64;
            dataContainer = new Float64Array(stack._columns * stack._rows * stack._numberOfFrames);
        }
    }
    var pixelType = itk.PixelTypes.Scalar;
    var components = 1;
    var itkImage = new itk.Image(new itk.ImageType(dimension, componentType, pixelType, components));
    for (var i = 0; i < stack._numberOfFrames; i++) {
        dataContainer.set(stack.frame[i].pixelData, i * stack._columns * stack._rows);
    }
    itkImage.data = dataContainer;
    itkImage.size = [stack._columns, stack._rows, stack._numberOfFrames];
    return itkImage;
};

imageGUIObjects = {
    smoothing: function () {
        var index = r1.stackHelper.index;
        var itkImage = createITKImage(stack, index);
        const args = ['smoothing.json', 'smoothing.shrink.json', '4'];
        const outputs = [
            { path: args[1], type: itk.IOTypes.Image }
        ];
        const inputs = [
            { path: args[0], type: itk.IOTypes.Image, data: itkImage }
        ];
        const pipelinePath = 'MedianFilterTest';

        itk.runPipelineBrowser(null, pipelinePath, args, outputs, inputs)
            .then(function ({ stdout, stderr, outputs, webWorker }) {
                webWorker.terminate();

                itk.writeArrayBuffer(null, false, outputs[0].data, '_smoothing.png', "image/png")
                    .then(function (writeReturn) {
                        writeReturn.webWorker.terminate();

                        DownloadFile(writeReturn.arrayBuffer, '_smoothing.png');
                    });

                stack.frame[index].pixelData = outputs[0].data.data.slice();
                stack._rawData = [];
                stack.pack();

                updateSliceMaterial(r1);
                updateSliceMaterial(r2);
                updateSliceMaterial(r3);
                updateVolumeMesh(vr);
                allModified();
            });
    },
    smoothingStack: function (index = null) {
        if (!index) {
            index = 0;
        }
        var itkImage = createITKImage(stack, index);
        const args = ['smoothing.json', 'smoothing.shrink.json', '4'];
        const outputs = [
            { path: args[1], type: itk.IOTypes.Image }
        ];
        const inputs = [
            { path: args[0], type: itk.IOTypes.Image, data: itkImage }
        ];
        const pipelinePath = 'MedianFilterTest';

        itk.runPipelineBrowser(null, pipelinePath, args, outputs, inputs)
            .then(function ({ stdout, stderr, outputs, webWorker }) {
                webWorker.terminate();

                stack.frame[index].pixelData = outputs[0].data.data.slice();
                if (index === stack._numberOfFrames - 1) {
                    stack._rawData = [];
                    stack.pack();

                    updateSliceMaterial(r1);
                    updateSliceMaterial(r2);
                    updateSliceMaterial(r3);
                    updateVolumeMesh(vr);
                    allModified();

                } else {
                    imageGUIObjects.smoothingStack(index + 1);
                }

            });
    },
    smoothing3D: function () {
        var itkImage = createITKImage3D(stack);
        const args = ['smoothing.json', 'smoothing.shrink.json', '4'];
        const outputs = [
            { path: args[1], type: itk.IOTypes.Image }
        ];
        const inputs = [
            { path: args[0], type: itk.IOTypes.Image, data: itkImage }
        ];
        const pipelinePath = 'MedianFilter3DTest';

        itk.runPipelineBrowser(null, pipelinePath, args, outputs, inputs)
            .then(function ({ stdout, stderr, outputs, webWorker }) {
                webWorker.terminate();

                var size = outputs[0].data.size;
                var type = outputs[0].data.imageType;
                for (var i = 0; i < size[2]; i++) {
                    switch (type.componentType) {
                        case itk.IntTypes.Int8:
                            stack.frame[i].pixelData = new Int8Array(outputs[0].data.data.slice(i * size[0] * size[1], (i + 1) * size[0] * size[1]));
                            break;
                        case itk.IntTypes.UInt8:
                            stack.frame[i].pixelData = new Uint8Array(outputs[0].data.data.slice(i * size[0] * size[1], (i + 1) * size[0] * size[1]));
                            break;

                    }
                }

                stack._rawData = [];
                stack.pack();
                updateSliceMaterial(r1);
                updateSliceMaterial(r2);
                updateSliceMaterial(r3);
                updateVolumeMesh(vr);
                allModified();

            });

    }
};

imageprocessGUISetting = function () {
    let imageprocessFolder = gui.addFolder('Image');
    imageprocessFolder.add(imageGUIObjects, 'smoothing');
    imageprocessFolder.add(imageGUIObjects, 'smoothingStack');
    imageprocessFolder.add(imageGUIObjects, 'smoothing3D');
};