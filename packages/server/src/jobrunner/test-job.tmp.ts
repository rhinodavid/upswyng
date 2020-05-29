const count = (x: number): void => {
  for (let i = 0; i < x; i++) {
    console.log(`Count: ${i + 1}`);
  }
};

console.error("test error");

count(3);

throw new Error("fuxxkk");

export {};
