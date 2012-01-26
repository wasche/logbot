
module.exports = {

  zeropad: function zeropad(n) {
    return (n.toString()).replace(/^(\d)$/,'0$1');
  }

, strip: function strip(str) {
    return str.replace(/^\s+|\s+$/, '');
  }

};
