const text = `
Question 1 What is the largest planet in our solar system? 
A) Earth B) Saturn C) Jupiter D) Uranus Answer: C) Jupiter 

Question 2 Which of the following programming languages is used for web development? 
A) Python B) Java C) C++ D) HTML Answer: D) HTML 

Question 3 What is the capital of France? 
A) Berlin B) Paris C) London D) Rome Answer: B) Paris 

Question 4 Which of the following authors wrote the novel "To Kill a Mockingbird"? 
A) F. Scott Fitzgerald B) Harper Lee C) Jane Austen D) J.K. Rowling Answer: B) Harper Lee 

Question 5 What is the chemical symbol for gold? 
A) Ag B) Au C) Hg D) Pb Answer: B) Au 

Question 6 Which of the following music genres originated in the southern United States? 
A) Rock and Roll B) Jazz C) Blues D) Country Answer: C) Blues 

Question 7 What is the largest mammal on Earth? 
A) Elephant B) Whale C) Hippopotamus D) Rhinoceros Answer: B) Whale 

Question 8 Which of the following ancient civilizations built the Great Pyramid of Giza? 
A) Egyptians B) Greeks C) Romans D) Mesopotamians Answer: A) Egyptians 

Question 9 What is the process by which plants make their own food? 
A) Respiration B) Photosynthesis C) Decomposition D) Fermentation Answer: B) Photosynthesis 

Question 10 Which of the following planets is known for being the hottest? 
A) Mercury B) Venus C) Mars D) Jupiter Answer: B) Venus
`;


const questionsArray = text.trim().split(/Question \d+/).slice(1);


const parsedQuestions = questionsArray.map((q, index) => {
    const [questionAndOptions, answer] = q.trim().split("Answer:");
    const questionText = questionAndOptions.split(/A\)/)[0].trim();
    
    // Regex to capture each option as "A) Option text" including multi-word options
    const options = questionAndOptions.match(/[A-D]\)\s+[^A-D]+/g).map(option => option.trim());
    
    return {
        question: `Question ${index + 1}: ${questionText}`,
        options: options,
        answer: `Answer: ${answer.trim()}`
    };
});

//console.log(parsedQuestions);
console.log(parsedQuestions.length)
console.log(parsedQuestions[0].question)
console.log(parsedQuestions[0].options[0])
console.log(parsedQuestions[0].options[1])
