const text = `
Warning: TT: undefined function: 21
Warning: TT: undefined function: 21
Here are 15 questions in the format you specified:

**Question 1:** What is the definition of leadership according to Lanre Amodu?

* Many people desire leadership, but they know what they desire.
* Others reject leadership, but they know not what they reject.
* Some even criticize leadership, but they know not what they criticize.
* Leadership is about positions or titles.
* Taking the lead in meeting the needs of others.

**Answer:** Many people desire leadership, but they know what they desire.

**Question 2:** Who defined leadership as a product of efficient management of self, time, task, and resources?

* David Oyedepo
* Lanre Amodu
* John Quincy Adams
* Napoleon Bonaparte

**Answer:** David Oyedepo

**Question 3:** What does David Oyedepo consider a leader to be?

* A need meeter
* A talker
* A doer
* A manager

**Answer:** A need meeter

**Question 4:** Who said, "Leaders will be those who empower others"?

* Bill Gates
* John Quincy Adams
* David Oyedepo
* Napoleon Bonaparte

**Answer:** Bill Gates

**Question 5:** What is the definition of a leader according to Alexander the Great?

* A dealer in hope
* A dealer in fear
* An army of lions led by a sheep
* A man who knows the way, goes the way, and shows the way

**Answer:** An army of sheep led by a lion

**Question 6:** Who said, "The problem isn’t that Johnny can’t read"?

* Thomas Sowell
* Stephen R. Covey
* George R.R. Martin
* John Ford

**Answer:** Thomas Sowell

**Question 7:** What is the definition of ethics according to Joanne Ciulla?

* The heart of leadership
* A means to achieve goals
* A way to treat others
* A behavior to achieve a goal

**Answer:** The heart of leadership

**Question 8:** Who said, "You can speak well if your tongue can deliver the message of your heart"?

* John Ford
* Thomas Edison
* Benjamin Franklin
* Mary Kay Ash

**Answer:** John Ford

**Question 9:** What is the focus of leaders according to David Imhonopi and Ugochukwu Urim?

* Meeting the needs of others
* Empowering others
* Developing excellent communication skills
* Translating vision into reality

**Answer:** Providing the momentum to actualize destiny

**Question 10:** Who said, "The doctor of the future will give no medicine but will instruct his patients in care of the human frame"?

* Thomas Edison
* Henry Ford
* Ray Kroc
* Benjamin Franklin

**Answer:** Thomas Edison

**Question 11:** What is the definition of a leader according to John Quincy Adams?

* One who knows the way, goes the way, and shows the way
* A need meeter
* A dealer in hope
* Someone who has followers

**Answer:** Someone who has followers

**Question 12:** Who said, "Leadership begins from the man who will in turn develop the society where he finds himself"?

* David Oyedepo
* Lanre Amodu
* John Quincy Adams
* Napoleon Bonaparte

**Answer:** David Oyedepo

**Question 13:** What is the definition of ethics according to Beauchamp and Bowie?

* Behaviors that are legally and morally acceptable to the larger community
* A means to achieve goals
* A way to treat others
* A behavior to achieve a goal

**Answer:** Behaviors that are legally and morally acceptable to the larger community

**Question 14:** Who said, "If you can’t explain it simply, you don’t understand it well enough"?

* Albert Einstein
* Stephen R. Covey
* Thomas Sowell
* John Ford

**Answer:** Albert Einstein

`;

// Split text by "Question" pattern and ignore the initial warnings or redundant entries
const questionsArray = text.split(/\*\*Question \d+:\*\*/).slice(1);

const parsedQuestions = questionsArray.map((q, index) => {
    // Split each question into the main question and answer
    const [questionAndOptions, answer] = q.split("**Answer:**");
    const [questionText, ...options] = questionAndOptions.trim().split("\n").filter(line => line.trim());

    // Remove asterisk (*) from options and trim extra whitespace
    const formattedOptions = options.map(option => option.replace(/^\* /, '').trim());

    return {
        question: `Question ${index + 1}: ${questionText.trim()}`,
        options: formattedOptions,
        answer: `Answer: ${answer.trim()}`
    };
});

//console.log(parsedQuestions[3]);