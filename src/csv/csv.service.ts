import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Csv } from './csv.entity';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import phone from 'phone';
import { CsvInsertDto } from './csv.dto';
@Injectable()
export class CsvService {
  constructor(@InjectModel(Csv.name) private readonly csvModel: Model<Csv>) {}

  async createStream(fileName) {
    return await fs.createReadStream(`./csvs/${fileName}`, 'utf8');
  }

  async readFile(fileName: string) {
    const data: CsvInsertDto[] = [];
    const phones: string[] = ['phone'];
    let countOfDuplicateInFile: number = 0;
    const model = this.csvModel;
    let badCounter = 0;
    const result = await new Promise(async (resolve, reject) => {
      (await this.createStream(fileName)).pipe(
        parse({
          delimiter: ',',
          from_line: 1,
          skip_empty_lines: true,
          skip_records_with_error: true,
          relax_column_count_less: true,
          relax_column_count_more: true,
        })
          .on('data', async function (row) {
            const validPhone = phone(row[0]);
            if (await validPhone.isValid) {
              row[0] = validPhone.phoneNumber;
              const element: CsvInsertDto = {
                phoneNumber: row[0],
                firstName: row[1],
                lastName: row[2],
                carrier: row[4] ? row[4] : null,
                listTag: fileName,
              };
              const phone = phones.find((element) => element === row[0]);
              if (phone) {
                countOfDuplicateInFile += 1;
              } else {
                data.push(element);
              }
            } else {
              badCounter += 1;
            }
            phones.push(row[0]);
          })
          .on('end', async function () {
            console.log('Data has been readed');
            let dublicateInMongo: number = 0;
            try {
              await model.insertMany(data, {
                ordered: false,
              });
            } catch (e) {
              if (e.code === 11000) {
                const csvIds = await e.result.result.writeErrors.map(
                  (error) => {
                    return error.err.op.phoneNumber;
                  },
                );
                dublicateInMongo = await csvIds.length;
                console.log(dublicateInMongo);
                await model.updateMany(
                  { phoneNumber: { $in: csvIds } },
                  { $push: { listTag: fileName } },
                );
              }
            }
            resolve({
              notValid: badCounter,
              duplicateInFile: countOfDuplicateInFile,
              dublicateInMongo: dublicateInMongo,
              data: data.length,
            });
          })
          .on('error', function (error) {
            reject(error);
          }),
      );
    });
    return await result;
  }
}
