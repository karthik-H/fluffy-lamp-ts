import { userToRow } from '../../../src/fetch-users';

describe('valid_user_happy_path', () => {
  test('valid_user_happy_path', () => {
    const user = { address: { city: 'Gwenborough', geo: { lat: '-37.3159', lng: '81.1496' }, street: 'Kulas Light', suite: 'Apt. 556', zipcode: '92998-3874' }, company: { bs: 'harness real-time e-markets', catchPhrase: 'Multi-layered client-server neural-net', name: 'Romaguera-Crona' }, email: 'Sincere@april.biz', id: 1, name: 'Leanne Graham', phone: '1-770-736-8031 x56442', username: 'Bret', website: 'hildegard.org' };
    expect(userToRow(user)).toEqual(['1','Leanne Graham','Bret','Sincere@april.biz','Kulas Light','Apt. 556','Gwenborough','92998-3874','-37.3159','81.1496','1-770-736-8031 x56442','hildegard.org','Romaguera-Crona','Multi-layered client-server neural-net','harness real-time e-markets']);
  });
});

describe('escape_special_characters_in_fields', () => {
  test('escape_special_characters_in_fields', () => {
    const user = { address: { city: 'Boone', geo: { lat: '10.0', lng: '20.0' }, street: 'Main, Street', suite: 'Suite "A"', zipcode: '00000' }, company: { bs: 'testing', catchPhrase: 'Hello, "world"', name: 'Test Co.' }, email: 'john@example.com', id: 2, name: 'John "JD" Doe', phone: '555-5555', username: 'jd,doe', website: 'test.com' };
    expect(userToRow(user)).toEqual(['2','"John ""JD"" Doe"','"jd,doe"','john@example.com','"Main, Street"','"Suite ""A"""','Boone','00000','10.0','20.0','555-5555','test.com','Test Co.','"Hello, ""world"""','testing']);
  });
});

describe('missing_optional_fields', () => {
  test('missing_optional_fields', () => {
    const user = { address: {}, company: {}, email: 'none@example.com', id: 3, name: 'No Address User', phone: '', username: 'nouser', website: '' };
    expect(userToRow(user)).toEqual(['3','No Address User','nouser','none@example.com','','','','','','','','','','','']);
  });
});

describe('null_fields_in_user_object', () => {
  test('null_fields_in_user_object', () => {
    const user = { address: null, company: null, email: null, id: null, name: null, phone: null, username: null, website: null };
    expect(userToRow(user)).toEqual(['','','','','','','','','','','','','','','']);
  });
});

describe('unexpected_additional_fields_are_ignored', () => {
  test('unexpected_additional_fields_are_ignored', () => {
    const user = { address: { city: 'Boone' }, email: 'extra@example.com', extraField1: 'ignored', extraField2: 12345, id: 4, name: 'Extra Fields', username: 'extra' };
    expect(userToRow(user)).toEqual(['4','Extra Fields','extra','extra@example.com','','','Boone','','','','','','','','']);
  });
});

describe('empty_user_object', () => {
  test('empty_user_object', () => {
    const user = {};
    expect(userToRow(user)).toEqual(['','','','','','','','','','','','','','','']);
  });
});

describe('whitespace_only_fields', () => {
  test('whitespace_only_fields', () => {
    const user = { address: { city: ' ', geo: { lat: ' ', lng: ' ' }, street: ' ', suite: ' ', zipcode: ' ' }, company: { bs: ' ', catchPhrase: ' ', name: ' ' }, email: ' ', id: ' ', name: ' ', phone: ' ', username: ' ', website: ' ' };
    expect(userToRow(user)).toEqual([' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ']);
  });
});

describe('partial_geo_coordinates', () => {
  test('partial_geo_coordinates', () => {
    const user = { address: { city: 'Boone', geo: { lat: '45.0' }, street: 'Test', suite: 'Test', zipcode: '00000' }, company: { name: 'Test Co' }, email: 'x@example.com', id: 10, name: 'Partial Geo', phone: '1234', username: 'partial', website: 'test.com' };
    expect(userToRow(user)).toEqual(['10','Partial Geo','partial','x@example.com','Test','Test','Boone','00000','45.0','','1234','test.com','Test Co','','']);
  });
});

describe('numeric_and_boolean_fields_stringified', () => {
  test('numeric_and_boolean_fields_stringified', () => {
    const user = { address: { city: true, geo: { lat: 100, lng: false }, street: 123, suite: 0, zipcode: 99999 }, company: { bs: false, catchPhrase: true, name: 55 }, email: 77, id: 42, name: 88, phone: true, username: false, website: 1234 };
    expect(userToRow(user)).toEqual(['42','88','false','77','123','0','true','99999','100','false','true','1234','55','true','false']);
  });
});

describe('non_object_input_rejected', () => {
  test('non_object_input_rejected', () => {
    const user = 'invalid' as any;
    expect(userToRow(user)).toEqual(['','','','','','','','','','','','','','','']);
  });
});
