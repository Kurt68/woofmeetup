export const generateMathCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  const operators = ['-', '+', 'x']
  const operator = operators[Math.floor(Math.random() * operators.length)]
  let solution
  switch (operator) {
    case '+':
      solution = num1 + num2
      break
    case '-':
      solution = num1 - num2
      break
    case 'x':
      solution = num1 * num2
      break
  }
  return {
    challenge: `${num1} ${operator} ${num2}`,
    solution: solution.toString(),
  }
}
