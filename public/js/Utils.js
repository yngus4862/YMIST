stackModified = function () {
    r0.modified = true;
    r1.modified = true;
    r2.modified = true;
    r3.modified = true;
};
allModified = function () {
    r0.modified = true;
    r1.modified = true;
    r2.modified = true;
    r3.modified = true;
    vr.modified = true;
};
cloneObject = function (obj) {
    var clone = {};
    for (var i in obj) {
        if (typeof (obj[i]) == "object" && obj[i] != null) {
            clone[i] = cloneObject(obj[i]);
        } else {
            clone[i] = obj[i];
        }
    }
    return clone;
};
getExtension = function (filename) {
    var extension = filename.split('.').pop().toUpperCase();
    return extension;
};