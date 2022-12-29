console.log('you are ready to start coding');

const root = document.createElement('div');
root.id = 'root';
document.body.append(root);

const main = document.createElement('div');
const child = document.createElement('p');
child.innerHTML = 'hello';
main.appendChild(child);
root.appendChild(main);
