export function getApiEndpoint(database:string, code:string) {

  return `./api/v1/task/${database}/${code}`;
}
