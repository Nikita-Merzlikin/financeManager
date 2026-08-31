import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

/**
 * Validates international bank account numbers (IBAN) according to ISO 13616 (MOD-97 checksum).
 */
export function validateIBAN(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const clean = value.replace(/[\s_]+/g, "").toUpperCase();

  // Country code (2 letters) + 2 check digits + BBAN (11-30 alphanumeric characters)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) {
    return false;
  }

  // Move first 4 characters to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to numbers (A = 10, B = 11, ..., Z = 35)
  let numericString = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else {
      numericString += rearranged[i];
    }
  }

  try {
    return BigInt(numericString) % 97n === 1n;
  } catch {
    return false;
  }
}

@ValidatorConstraint({ name: "isIban", async: false })
export class IsIbanConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return validateIBAN(value);
  }

  defaultMessage(args?: ValidationArguments): string {
    return `${args?.property ?? "value"} must be a valid IBAN`;
  }
}

export function IsIban(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsIbanConstraint,
    });
  };
}
