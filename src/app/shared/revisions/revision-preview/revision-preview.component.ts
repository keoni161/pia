import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { Pia } from 'src/app/entry/pia.model';
import { Answer } from 'src/app/entry/entry-content/questions/answer.model';

import { AppDataService } from 'src/app/services/app-data.service';
import { Measure } from 'src/app/entry/entry-content/measures/measure.model';
import { Evaluation } from 'src/app/entry/entry-content/evaluations/evaluation.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-revision-preview',
  templateUrl: './revision-preview.component.html',
  styleUrls: ['./revision-preview.component.scss'],
  providers: [AppDataService]
})
export class RevisionPreviewComponent implements OnInit {
  @Input() revision: any;
  pia: Pia;
  allData: any;
  data: any;

  constructor(private _translateService: TranslateService, public _appDataService: AppDataService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.revision && changes.revision.currentValue) {
      // CONSTRUC A NEW PIA FOR THE PREVIEW MODE
      this.pia = new Pia();
      this.pia.id = changes.revision.currentValue.id;
      this.pia.status = changes.revision.currentValue.status;
      this.pia.name = changes.revision.currentValue.name;
      this.pia.category = changes.revision.currentValue.category;
      this.pia.author_name = changes.revision.currentValue.author_name;
      this.pia.evaluator_name = changes.revision.currentValue.evaluator_name;
      this.pia.validator_name = changes.revision.currentValue.validator_name;
      this.pia.dpo_status = changes.revision.currentValue.dpo_status;
      this.pia.dpo_opinion = changes.revision.currentValue.dpo_opinion;
      this.pia.concerned_people_opinion = changes.revision.currentValue.concerned_people_opinion;
      this.pia.concerned_people_status = changes.revision.currentValue.concerned_people_status;
      this.pia.concerned_people_searched_opinion = changes.revision.currentValue.concerned_people_searched_opinion;
      this.pia.concerned_people_searched_content = changes.revision.currentValue.concerned_people_searched_content;
      this.pia.rejected_reason = changes.revision.currentValue.rejected_reason;
      this.pia.applied_adjustements = changes.revision.currentValue.applied_adjustements;
      this.pia.dpos_names = changes.revision.currentValue.dpos_names;
      this.pia.people_names = changes.revision.currentValue.people_names;
      this.pia.progress = changes.revision.currentValue.progress;
      this.pia.is_example = changes.revision.currentValue.is_example;
      this.pia.is_archive = changes.revision.currentValue.is_archive;
      this.pia.structure_id = changes.revision.currentValue.structure_id;
      this.pia.structure_name = changes.revision.currentValue.structure_name;
      this.pia.structure_sector_name = changes.revision.currentValue.structure_sector_name;
      this.pia.structure_data = changes.revision.currentValue.structure_data;

      if (this.pia.structure_data) {
        this._appDataService.dataNav = this.pia.structure_data;
      } else {
        this._appDataService.resetDataNav();
      }

      this.data = this._appDataService.dataNav;
      this.getJsonInfo();
    }
  }

  private async getJsonInfo() {
    this.allData = {};
    this.data.sections.forEach(async section => {
      this.allData[section.id] = {};
      section.items.forEach(async item => {
        this.allData[section.id][item.id] = {};
        const ref = section.id.toString() + '.' + item.id.toString();

        // Measure
        if (item.is_measure) {
          this.allData[section.id][item.id] = [];

          const entries: any = this.revision.measures;
          entries.forEach(async measure => {
            /* Completed measures */
            if (measure.title !== undefined && measure.content !== undefined) {
              let evaluation = null;
              if (item.evaluation_mode === 'question') {
                evaluation = await this.getEvaluation(section.id, item.id, ref + '.' + measure.id);
              }
              this.allData[section.id][item.id].push({
                title: measure.title,
                content: measure.content,
                evaluation: evaluation
              });
            }
          });
        } else if (item.questions) {
          // Question
          item.questions.forEach(async question => {
            this.allData[section.id][item.id][question.id] = {};

            // Find answer
            const answerModel = new Answer();
            let answer = this.revision.answers.find(a => a.reference_to === question.id);
            if (answer) {
              answerModel.data = this.revision.answers.find(a => a.reference_to === question.id).data;

              /* An answer exists */
              if (answerModel.data) {
                const content = [];
                if (answerModel.data.gauge && answerModel.data.gauge > 0) {
                  content.push(this._translateService.instant(this.pia.getGaugeName(answerModel.data.gauge)));
                }
                if (answerModel.data.text && answerModel.data.text.length > 0) {
                  content.push(answerModel.data.text);
                }
                if (answerModel.data.list && answerModel.data.list.length > 0) {
                  content.push(answerModel.data.list.join(', '));
                }
                if (content.length > 0) {
                  if (item.evaluation_mode === 'question') {
                    const evaluation = await this.getEvaluation(section.id, item.id, ref + '.' + question.id);
                    this.allData[section.id][item.id][question.id].evaluation = evaluation;
                  }
                  this.allData[section.id][item.id][question.id].content = content.join(', ');
                }
              }
            }
          });
        }
        if (item.evaluation_mode === 'item') {
          const evaluation = await this.getEvaluation(section.id, item.id, ref);
          this.allData[section.id][item.id]['evaluation_item'] = evaluation;
        }
      });
    });
  }

  private async getEvaluation(section_id: string, item_id: string, ref: string) {
    return new Promise(async (resolve, reject) => {
      let evaluation = null;
      const evaluationModel = new Evaluation();
      // const exist = await evaluationModel.getByReference(this.pia.id, ref);
      const exist = this.revision.evaluations.find(e => e.reference_to === ref);
      if (exist) {
        evaluationModel.id = exist.id;
        evaluationModel.status = exist.status;
        evaluationModel.pia_id = this.pia.id;
        evaluationModel.reference_to = exist.reference_to;
        evaluationModel.action_plan_comment = exist.action_plan_comment;
        evaluationModel.evaluation_comment = exist.evaluation_comment;
        evaluationModel.evaluation_date = exist.evaluation_date;
        evaluationModel.gauges = exist.gauges;
        evaluationModel.estimated_implementation_date = new Date(exist.estimated_implementation_date);
        evaluationModel.person_in_charge = exist.person_in_charge;
        evaluationModel.global_status = exist.global_status;

        evaluation = {
          title: evaluationModel.getStatusName(),
          action_plan_comment: evaluationModel.action_plan_comment,
          evaluation_comment: evaluationModel.evaluation_comment,
          gauges: {
            riskName: {
              value: this._translateService.instant('sections.' + section_id + '.items.' + item_id + '.title')
            },
            seriousness: evaluationModel.gauges ? evaluationModel.gauges.x : null,
            likelihood: evaluationModel.gauges ? evaluationModel.gauges.y : null
          }
        };
      }
      resolve(evaluation);
    });
  }
}