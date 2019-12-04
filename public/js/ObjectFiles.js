fileGUIObjects = {
    namelist: "",
    iFilelist: [],
    sFilelist: [],
    cFilelist: [],
    downloadFormat: "NRRD",
    downloadName: '',
    downloadStack: function (target = null, nameAs = null) {
        var arrayBuffer;
        target = stack;
        if (this.downloadFormat === 'NRRD') {
            var nrrd = {};
            if (stack.rightHanded === true) {
                //nrrd.space = "right-anterior-superior";
                nrrd.space = "left-posterior-superior";
                nrrd.spaceDirections = [[stack._spacing.getComponent(0), 0, 0], [0, stack._spacing.getComponent(1), 0], [0, 0, stack._spacing.getComponent(2)]];
            } else {
                nrrd.space = "left-anterior-superior";
                //nrrd.space = "right-posterior-superior";
                nrrd.spaceDirections = [[stack._spacing.getComponent(0), 0, 0], [0, stack._spacing.getComponent(1), 0], [0, 0, stack._spacing.getComponent(2)]];
            }
            nrrd.sizes = [stack._columns, stack._rows, stack._numberOfFrames];
            nrrd.spaceOrigin = stack.frame[0].imagePosition;
            if (stack.pixelType === 0) {
                if (stack._bitsAllocated === 8) {
                    if (stack.minMax[0] < 0) {
                        nrrd.type = 'int8';
                        nrrd.data = new Uint8Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    } else {
                        nrrd.type = 'uint8';
                        nrrd.data = new Uint8Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    }
                } else if (stack._bitsAllocated === 16) {
                    if (stack.minMax[0] < 0) {
                        nrrd.type = 'int16';
                        nrrd.data = new Uint16Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    } else {
                        nrrd.type = 'uint16';
                        nrrd.data = new Uint16Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    }
                } else if (stack._bitsAllocated === 32) {
                    if (stack.minMax[0] < 0) {
                        nrrd.type = 'int32';
                        nrrd.data = new Uint32Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    } else {
                        nrrd.type = 'uint32';
                        nrrd.data = new Uint32Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
                    }
                }
            } else if (stack.pixelType === 1) {
                nrrd.type = 'float';
                nrrd.data = new Float32Array(nrrd.sizes[2] * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
            }
            var systemEndianness = (function () {
                var buf = new ArrayBuffer(4),
                    intArr = new Uint32Array(buf),
                    byteArr = new Uint8Array(buf);
                intArr[0] = 0x01020304;
                if (byteArr[0] === 1 && byteArr[1] === 2 && byteArr[2] === 3 && byteArr[3] === 4) {
                    return 'big';
                } else if (byteArr[0] === 4 && byteArr[1] === 3 && byteArr[2] === 2 && byteArr[3] === 1) {
                    return 'little';
                }
                console.warn("Unrecognized system endianness!");
                return undefined;
            })();
            nrrd.endian = systemEndianness;
            for (var i = 0; i < stack._numberOfFrames; i++) {
                var index = i;
                if (!stack.rightHanded) {
                    index = nrrd.sizes[2] - 1 - i;
                }
                nrrd.data.set(stack.frame[i].pixelData, index * nrrd.sizes[1] * nrrd.sizes[0] * stack.numberOfChannels);
            }
            nrrd.modality = stack._modality;
            nrrd.encoding = 'raw';
            AMI.NrrdParser.compress(nrrd);
            arrayBuffer = AMI.NrrdParser.serialize(nrrd);
        } else if (this.downloadFormat === 'NII') {
            arrayBuffer = AMI.NrrdParser.serialize(nrrd);
        }
        if (!nameAs) {
            DownloadFile(arrayBuffer, this.downloadName + ".nrrd");
        } else {
            DownloadFile(arrayBuffer, nameAs + ".nrrd");
        }
    },
    downloadSegment: function () {
        this.downloadStack(segment, this.downloadName + '.seg');
    },
    downloadLUT: function () {
        const data = parserLUT.serialize(segmentationGUIObjects.segments);
        DownloadFile(data, this.downloadName + '.lut.txt');
    }
};

fileGUISetting = function () {
    let fileFolder = gui.addFolder('File');
    fileFolder.add(fileGUIObjects, 'namelist', fileGUIObjects.namelist);
    fileFolder.add(fileGUIObjects, 'downloadFormat', ["NRRD", "NII"]);
    fileFolder.add(fileGUIObjects, 'downloadName');
    fileFolder.add(fileGUIObjects, 'downloadStack');
    fileFolder.add(fileGUIObjects, 'downloadSegment');
    fileFolder.add(fileGUIObjects, 'downloadLUT');
};

DownloadFile = function (buffer, fileName) {
    const textToSaveAsBlob = new Blob([buffer], { type: 'application/octet-stream' });
    const textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);

    const downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = event => document.body.removeChild(event.target);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    downloadLink.click();
};

parserLUT = class {
    constructor() {
    }
    static parse(data) {
        var buffer = data.buffer;
        var filename = data.url;
        var extension = getExtension(filename);
        return new Promise((resolve, reject) => {
            var lutObj = {};
            var buff = new Uint8Array(buffer);
            var encodedString = String.fromCharCode.apply(null, buff);
            if (extension === 'JSON') {
                var jsonObj = JSON.parse(encodedString);
                for (var key in jsonObj) {
                    if (key != 0 && jsonObj[key].color[3] == 0) {
                        jsonObj[key].color[3] = 1;
                    }
                    lutObj[jsonObj[key].id] =
                        {
                            color: [jsonObj[key].color[0], jsonObj[key].color[1], jsonObj[key].color[2]],
                            opacity: jsonObj[key].color[3],
                            label: jsonObj[key].name
                        };
                }
            }
            resolve(lutObj);
        });
    }
    static serialize(segmentObj) {
        return new Promise((resolve, reject) => {
            var line = '';
            for (var key in segmentObj) {
                line += key + ' ' + segmentObj[key].label + ' '
                    + segmentObj[key].color[0] + ' '
                    + segmentObj[key].color[1] + ' '
                    + segmentObj[key].color[2] + ' '
                    + segmentObj[key].opacity + '\n';
            }
            buffer = new ArrayBuffer(line.length);
            arr = new Uint8Array(buffer);
            for (i = 0; i < line.length; i++) {
                arr[i] = line.charCodeAt(i);
            }

            resolve(buffer);
        });
    }
};

fileListOut = function () {
    var listname = $("#fileLists").html("loading...");
    listname.empty();
    fileGUIObjects.namelist = [];
    var iFilelist = fileGUIObjects.iFilelist;
    for (var i = 0; i < iFilelist.length; i++) {
        listname.append(iFilelist[i].name);
        listname.append($("<br/>"));
        fileGUIObjects.namelist.push(iFilelist[i].name);
    }
    var sFilelist = fileGUIObjects.sFilelist;
    for (var i = 0; i < sFilelist.length; i++) {
        listname.append(sFilelist[i].name);
        listname.append($("<br/>"));
        fileGUIObjects.namelist.push(sFilelist[i].name);
    }
    var cFilelist = fileGUIObjects.cFilelist;
    for (var i = 0; i < cFilelist.length; i++) {
        listname.append(cFilelist[i].name);
        listname.append($("<br/>"));
        fileGUIObjects.namelist.push(cFilelist[i].name);
    }
};
loadIFiles = function (event) {
    var iFilelist = fileGUIObjects.iFilelist;
    var dataTransfer = event.dataTransfer;
    files = event.target.files || dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        iFilelist.push(files[i]);
    }

    fileListOut();
};
loadSFiles = function (event) {
    var sFilelist = fileGUIObjects.sFilelist;
    var dataTransfer = event.dataTransfer;
    files = event.target.files || dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        sFilelist.push(files[i]);
    }

    fileListOut();
};
loadCFiles = function (event) {
    var cFilelist = fileGUIObjects.cFilelist;
    var dataTransfer = event.dataTransfer;
    files = event.target.files || dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        cFilelist.push(files[i]);
    }

    fileListOut();
};

readFile = function (file) {
    const reader = new FileReader();
    return new Promise(function (resolve, reject) {
        reader.onerror = function () {
            reader.abort();
            reject();
        };
        reader.onload = function (event) {
            var response = {
                url: reader.filename,
                buffer: reader.result
            };
            resolve(response);
        };
        reader.filename = file.name;
        reader.readAsArrayBuffer(file);
    });
};
parseFiles = function () {
    loaderI = new AMI.VolumeLoader();
    loaderS = new AMI.VolumeLoader();
    //parserC = new parserLUT();
    parserC = parserLUT;

    var iFilelist = fileGUIObjects.iFilelist;
    readPromisesI = [];
    for (var i = 0; i < iFilelist.length; i++) {
        readPromisesI.push(readFile(iFilelist[i]));
    }
    var sFilelist = fileGUIObjects.sFilelist;
    readPromisesS = [];
    for (var i = 0; i < sFilelist.length; i++) {
        readPromisesS.push(readFile(sFilelist[i]));
    }
    var cFilelist = fileGUIObjects.cFilelist;
    readPromisesC = [];
    for (var i = 0; i < cFilelist.length; i++) {
        readPromisesC.push(readFile(cFilelist[i]));
    }

    readPromises = [];
    readPromises.push(Promise.all(readPromisesI)
        .then(function (rawdatas) {
            parsePromises = [];
            for (var i = 0; i < rawdatas.length; i++) {
                parsePromises.push(loaderI.parse([rawdatas[i]]));
            }
            return Promise.all(parsePromises);/**/
        })
        .then(function (datas) {
            if (datas.length === 0) {
                return;
            }
            loaderI.free();
            loaderI = null;

            return datas[0].mergeSeries(datas);
        })
        .catch(function (error) {
            if (error === 'Aborted') {
                return;
            }
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        }));
    readPromises.push(Promise.all(readPromisesS)
        .then(function (rawdatas) {
            parsePromises = [];
            for (var i = 0; i < rawdatas.length; i++) {
                parsePromises.push(loaderS.parse([rawdatas[i]]));
            }
            return Promise.all(parsePromises);/**/
        })
        .then(function (datas) {
            if (datas.length === 0) {
                return;
            }
            loaderS.free();
            loaderS = null;

            return datas[0].mergeSeries(datas);
        })
        .catch(function (error) {
            if (error === 'Aborted') {
                return;
            }
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        }));
    readPromises.push(Promise.all(readPromisesC)
        .then(function (rawdatas) {
            parsePromises = [];
            for (var i = 0; i < rawdatas.length; i++) {
                parsePromises.push(parserC.parse(rawdatas[i]));
            }
            return Promise.all(parsePromises);
        })
        .catch(function (error) {
            if (error === 'Aborted') {
                return;
            }
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        }));

    return Promise.all(readPromises);
};
