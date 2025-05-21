// utils/cleanCode.js
function cleanCode(inputCode, maxBlankLines = 1) {
    const lines = inputCode.split('\n');
    let result = [];
    let blankCount = 0;
  
    for (const line of lines) {
      if (line.trim() === '') {
        blankCount++;
      } else {
        blankCount = 0;
      }
  
      if (blankCount <= maxBlankLines) {
        result.push(line);
      }
    }
  
    return result.join('\n');
  }
  
export default cleanCode