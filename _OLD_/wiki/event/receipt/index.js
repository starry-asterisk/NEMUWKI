HTMLElement.prototype.setAttributes = function (options) {
  for (let name in options) this.setAttribute(name, options[name]);
  return this;
}
HTMLElement.prototype.setStyles = function (options) {
  for (let name in options) this.style.setProperty(name, options[name]);
  return this;
}

function createOption() {
  const id = (Math.random() * 1000000000).toString(16);
  const li = document.createElement('li');

  const p = document.createElement('p');
  const input_label = document.createElement('input').setAttributes({
    type: 'text',
    maxlength: 25,
    name: `label_${id}`,
    placeholder: '설정 명칭'
  });
  const button_more = document.createElement('button').setAttributes({
    type: 'button',
    class: 'more'
  });
  const button_up = document.createElement('button').setAttributes({
    type: 'button',
    class: 'up'
  });
  const button_down = document.createElement('button').setAttributes({
    type: 'button',
    class: 'down'
  });
  const button_delete = document.createElement('button').setAttributes({
    type: 'button',
    class: 'delete'
  });

  const div = document.createElement('div');
  const input_value = document.createElement('input').setAttributes({
    type: 'text',
    name: `value_${id}`,
    placeholder: '설정 명칭'
  });

  li.append(p);
  p.append(input_label);
  p.append(button_more);
  p.append(button_up);
  p.append(button_down);
  p.append(button_delete);

  li.append(div);
  div.append(input_value);
  input_list.append(li);

  button_up.onclick = e => {
    if(li.previousElementSibling)  li.previousElementSibling.before(li);
  }
  button_down.onclick = e => {
    if(li.nextElementSibling)  li.nextElementSibling.after(li);
  }
  button_delete.onclick = e => {
    li.remove();
  }
}